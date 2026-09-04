// Teste do §9.1 — Linha do Tempo (Linha_do_Tempo.html)
// Cobre: pagina carrega, header e skip-link, 4 era-groups, 5 event-cards,
// ordem cronologica, deep-link "Abrir no mapa", link no index, reduced-motion.
//
// A timeline renderiza via fetch de historia-api.json e __TIMELINE__.load().

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
  // ========== Bloco 1: pagina carrega e tem header (3 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    const resp = await page.goto(BASE + "/Linha_do_Tempo.html", { waitUntil: "load" });
    check("pagina: status 200", resp?.status() === 200, `status=${resp?.status()}`);

    await page.waitForSelector("header.site-head", { timeout: 5000 });
    check("header: <header.site-head> visivel", await page.locator("header.site-head").isVisible());

    const temSkip = await page.evaluate(() => {
      const a = document.querySelector("a.skip-link");
      return a && a.getAttribute("href") === "#mainContent" && a.textContent.trim().length > 0;
    });
    check("a11y: skip-link para #mainContent presente", temSkip);
    await ctx.close();
  }

  // ========== Bloco 2: 4 era-groups + 5 event-cards (3 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Linha_do_Tempo.html", { waitUntil: "load" });
    // Espera a timeline renderizar via fetch
    await page.waitForFunction(() => document.querySelectorAll(".era-group").length === 4, {
      timeout: 5000
    });

    const grupos = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".era-group")).map((g) => ({
        era: [...g.classList].find((c) => c.startsWith("era-") && c !== "era-group"),
        cards: g.querySelectorAll(".event-card").length
      }))
    );
    check(
      "timeline: 4 era-groups (I, II, III, IV)",
      grupos.length === 4 &&
        grupos[0].era === "era-I" &&
        grupos[1].era === "era-II" &&
        grupos[2].era === "era-III" &&
        grupos[3].era === "era-IV",
      `grupos=${JSON.stringify(grupos.map((g) => g.era))}`
    );

    const totalCards = grupos.reduce((s, g) => s + g.cards, 0);
    check(
      "timeline: 5 event-cards no total (1 em I, 1 em II, 1 em III, 2 em IV)",
      totalCards === 5 &&
        grupos[0].cards === 1 &&
        grupos[1].cards === 1 &&
        grupos[2].cards === 1 &&
        grupos[3].cards === 2,
      `distribuicao=${JSON.stringify(grupos.map((g) => g.cards))} total=${totalCards}`
    );

    // Cada card tem h3 (nao <div>) e CTA
    const estruturaCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".event-card"));
      return cards.map((c) => ({
        h3: !!c.querySelector("h3"),
        cta: !!c.querySelector("a.cta")
      }));
    });
    check(
      "a11y: cada event-card tem <h3> + <a class='cta'>",
      estruturaCards.every((c) => c.h3 && c.cta),
      `count=${estruturaCards.length}`
    );
    await ctx.close();
  }

  // ========== Bloco 3: ordem cronologica dentro de cada era (1 check) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Linha_do_Tempo.html", { waitUntil: "load" });
    await page.waitForFunction(() => document.querySelectorAll(".era-group").length === 4, {
      timeout: 5000
    });

    // Pega ordem das datas dos <p class="kicker"> de cada era-group
    const ordemDatas = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".era-group")).map((g) => {
        const kickers = Array.from(g.querySelectorAll(".event-card .kicker")).map((k) =>
          k.textContent.trim()
        );
        return kickers;
      });
    });
    // Para era IV (2 cards: Abismo, depois Obsidianas climax), a ordem deve
    // ser por ano+climax. Validacao simples: a data "ano 12 (climax)" vem
    // depois de "ano 12".
    const ivOrdemOK = await page.evaluate(() => {
      const iv = document.querySelector(".era-IV");
      if (!iv) return null;
      const kickers = Array.from(iv.querySelectorAll(".event-card .kicker")).map((k) =>
        k.textContent.trim()
      );
      const idx12 = kickers.findIndex((k) => /ano\s+12(?!\s*\()/i.test(k));
      const idxClimax = kickers.findIndex((k) => /\(cl[íi]max\)/i.test(k));
      return idx12 >= 0 && idxClimax > idx12;
    });
    check(
      "ordem: em era IV, Erupcao do Abismo (ano 12) vem antes de Obsidianas (climax)",
      ivOrdemOK === true,
      `ordemIV=${JSON.stringify(ordemDatas[3])}`
    );
    await ctx.close();
  }

  // ========== Bloco 4: deep-link "Abrir no mapa" (2 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Linha_do_Tempo.html", { waitUntil: "load" });
    await page.waitForFunction(() => document.querySelectorAll(".event-card").length === 5, {
      timeout: 5000
    });

    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".event-card .cta")).map((a) => a.getAttribute("href"))
    );
    check(
      "deep-link: 5 CTAs apontam pra Mapa_Aetheria.html#<battle-id>",
      hrefs.length === 5 &&
        hrefs.every((h) => typeof h === "string" && h.startsWith("Mapa_Aetheria.html#")),
      `hrefs=${JSON.stringify(hrefs)}`
    );

    // Clica no 1o CTA -> tem que navegar
    const primeiroHref = hrefs[0];
    await Promise.all([
      page.waitForURL((u) => u.toString().includes("Mapa_Aetheria.html"), { timeout: 5000 }),
      page.click(".event-card .cta")
    ]);
    check(
      "deep-link: click no CTA navega pra Mapa_Aetheria.html",
      page.url().includes("Mapa_Aetheria.html"),
      `url=${page.url()}`
    );
    // Valida tambem que o id do battle foi passado no hash
    const idEsperado = decodeURIComponent(primeiroHref.split("#")[1] || "");
    check(
      `deep-link: hash contem o id da battle (${idEsperado})`,
      decodeURIComponent(page.url().split("#")[1] || "") === idEsperado,
      `hash=${page.url().split("#")[1]}`
    );
    await ctx.close();
  }

  // ========== Bloco 5: link no index.html (1 check) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "load" });
    await page.waitForSelector(".character-card", { timeout: 8000 });
    const link = await page.evaluate(() => {
      const a = document.querySelector(".site-header a[href*='Linha_do_Tempo']");
      return a ? { text: a.textContent.trim(), href: a.getAttribute("href") } : null;
    });
    check(
      "header index.html: link 'Linha do Tempo' presente e aponta pra pagina certa",
      link && link.href === "Linha_do_Tempo.html" && /linha do tempo/i.test(link.text),
      `link=${JSON.stringify(link)}`
    );
    await ctx.close();
  }

  // ========== Bloco 6: reduced-motion zera scroll-snap-type (1 check) ==========
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      reducedMotion: "reduce"
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Linha_do_Tempo.html", { waitUntil: "load" });
    await page.waitForSelector(".timeline-rail", { timeout: 5000 });
    const snap = await page.evaluate(() => {
      return getComputedStyle(document.querySelector(".timeline-rail")).scrollSnapType;
    });
    check(
      "reduced-motion: scroll-snap-type = 'none' (sem 'puxao' forcado)",
      snap === "none",
      `scrollSnapType=${snap}`
    );
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
