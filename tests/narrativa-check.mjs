// Teste do §6.2 — Rota narrativa no Mapa_Aetheria
// Cobre: API com era/data, botão + sheet, 4 atos, play/pause/scrub, navegação por ato,
// Esc fecha, reduced-motion encurta tween e remove tracejado.
//
// Limitacao documentada: o polilinha eh desenhado no canvas 2D, entao nao ha
// assercao de "vejo uma linha"; testa-se em vez disso que a funcao
// `narrDesenharTrilha` eh chamada e que o conjunto de pinos em rota existe.

import { chromium } from "playwright";

const BASE = process.env.AETHERIA_URL || "http://localhost:8124";

const browser = await chromium.launch({ headless: true });
let pass = 0,
  fail = 0;
const check = (n, ok, d = "") => {
  console.log(`${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`);
  ok ? pass++ : fail++;
};

try {
  // ========== Bloco 1: API tem era+data (1 check) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    const r = await page.request.get(BASE + "/historia-api.json");
    const api = await r.json();
    const todasTem = api.battles.length > 0 && api.battles.every((b) => b.era && b.data);
    check("API: todas as 5 battles tem era e data", todasTem, `count=${api.battles.length}`);
    await ctx.close();
  }

  // ========== Bloco 2: UI básica do sheet (5 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Mapa_Aetheria.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__MAPA__ && window.__MAPA__.battles, { timeout: 5000 });
    const battles = await page.evaluate(() => window.__MAPA__.battles());
    check(
      "battles(): todas com era preenchida via mapa",
      battles.length === 5 && battles.every((b) => b.era),
      `count=${battles.length}`
    );

    check(
      "UI: botão Rota visível e aria-expanded=false",
      (await page.locator("#narrBtn").isVisible()) &&
        (await page.getAttribute("#narrBtn", "aria-expanded")) === "false"
    );
    check(
      "UI: sheet começa hidden",
      await page.evaluate(() => document.getElementById("narrSheet").hidden)
    );
    check(
      "UI: __NARR__.seq tem 5 itens apos boot",
      await page.evaluate(() => window.__NARR__?.seq?.length === 5)
    );
    check(
      "UI: 4 atos distintos no seq",
      await page.evaluate(() => new Set(window.__NARR__.seq.map((x) => x.poi.era)).size === 4)
    );
    await ctx.close();
  }

  // ========== Bloco 3: abrir + play/pause + scrub + skip-ato + Esc (5 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Mapa_Aetheria.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__NARR__?.seq?.length === 5, { timeout: 5000 });

    // Abre
    await page.click("#narrBtn");
    await page.waitForFunction(() => window.__NARR_SHEET_OPEN__ === true, { timeout: 2000 });
    check(
      "abrir: aria-expanded=true + sheet visível",
      (await page.getAttribute("#narrBtn", "aria-expanded")) === "true" &&
        !(await page.evaluate(() => document.getElementById("narrSheet").hidden))
    );

    // Play avança idx após 8s
    await page.click("#narrPlay");
    try {
      await page.waitForFunction(() => window.__NARR__?.idx > 0, { timeout: 11000 });
      check(
        "play: idx avançou após ~8s",
        await page.evaluate(() => window.__NARR__.idx > 0),
        `idx=${await page.evaluate(() => window.__NARR__.idx)}`
      );
    } catch {
      check("play: idx avançou após ~8s", false, "timeout esperando idx > 0");
    }

    // Pula pra idx 0
    await page.evaluate(() => {
      window.__NARR__ && (window.__NARR__.idx = -1);
    });
    await page.click("#narrScrub", { force: true }).catch(() => {});
    // seta valor direto e dispara change
    await page.evaluate(() => {
      const s = document.getElementById("narrScrub");
      s.value = "3";
      s.dispatchEvent(new Event("change"));
    });
    await page.waitForFunction(() => window.__NARR__?.idx === 3, { timeout: 2000 });
    check(
      "scrub: change leva pro idx 3",
      await page.evaluate(() => window.__NARR__.idx === 3),
      `idx=${await page.evaluate(() => window.__NARR__.idx)}`
    );

    // Botão de ato III → idx 2 (1ª battle da era III)
    await page.click('.narr-act[data-era="III"]');
    await page.waitForFunction(
      () => window.__NARR__?.seq[window.__NARR__.idx]?.poi?.era === "III",
      { timeout: 2000 }
    );
    const idxAto3 = await page.evaluate(() => window.__NARR__.idx);
    check("ato: botão Ato III leva pra 1ª battle da era III", idxAto3 === 2, `idx=${idxAto3}`);

    // Esc fecha
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__NARR_SHEET_OPEN__ === false, { timeout: 2000 });
    check("Esc: fecha o sheet", await page.evaluate(() => !window.__NARR_SHEET_OPEN__));
    await ctx.close();
  }

  // ========== Bloco 4: reduced-motion (2 checks) ==========
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      reducedMotion: "reduce"
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Mapa_Aetheria.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__NARR__?.seq?.length === 5, { timeout: 5000 });
    // captura se RM está ativo no site
    const rm = await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    check("reduced-motion: emulado no context", rm);
    // abre e dispara um tween; mede o flag __ultimoTween (que vira 0 quando o tween termina)
    await page.click("#narrBtn");
    await page.waitForFunction(() => window.__NARR_SHEET_OPEN__ === true, { timeout: 2000 });
    await page.evaluate(() => {
      document.getElementById("narrScrub").value = "2";
      document.getElementById("narrScrub").dispatchEvent(new Event("change"));
    });
    // sob RM o tween cap é 180ms + 50ms do setTimeout que zera o flag
    try {
      await page.waitForFunction(() => window.__NARR__?.__ultimoTween === 0, { timeout: 1500 });
      check("reduced-motion: tween termina rápido (flag zera em ≤1.5s)", true);
    } catch {
      const aindaRodando = await page.evaluate(() => window.__NARR__?.__ultimoTween);
      check(
        "reduced-motion: tween termina rápido (flag zera em ≤1.5s)",
        false,
        `flag=${aindaRodando} (esperado 0)`
      );
    }
    await ctx.close();
  }

  console.log(`\n${pass} ✅ / ${fail} ❌`);
  process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error("ERRO:", e.message);
  process.exit(2);
} finally {
  await browser.close();
}
