// Teste rapido do onboarding: cobre os 4 caminhos criticos
// 1) 1a visita: overlay aparece
// 2) botao "Pular" fecha e marca como visto (recarregando NAO aparece)
// 3) botao "Proximo" navega entre os 4 passos; ultimo passo diz "Comecar a explorar"
// 4) Esc fecha
// 5) Click no backdrop fecha
// 6) Ja onboarded: overlay NAO aparece

import { chromium } from "playwright";

const BASE = process.env.AETHERIA_URL || "http://localhost:8124";
const browser = await chromium.launch({ headless: true });
let pass = 0,
  fail = 0;
const check = (n, ok, d = "") => {
  console.log(`${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`);
  ok ? pass++ : fail++;
};

async function newPage() {
  const ctx = await browser.newContext({ serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  return { ctx, page };
}

try {
  // 1) 1a visita
  {
    const { ctx, page } = await newPage();
    await page.waitForSelector("#onboardOverlay:not([hidden])", { timeout: 3000 });
    const visible = await page.locator("#onboardOverlay").isVisible();
    check("1a visita: overlay visivel", visible);
    const title = await page.locator("#onboardTitle").textContent();
    check("1a visita: titulo correto", title.includes("Bem-vindo"), `titulo="${title}"`);
    const step0 = await page.locator(".onboard-step.is-active").textContent();
    check(
      "1a visita: passo 0 ativo",
      step0.includes("códice vivo") || step0.includes("Um códice"),
      `conteudo="${step0.slice(0, 80)}"`
    );
    await ctx.close();
  }

  // 2) botao Pular fecha e persiste
  {
    const { ctx, page } = await newPage();
    await page.waitForSelector("#onboardOverlay:not([hidden])", { timeout: 3000 });
    await page.click("#onboardSkip");
    await page.waitForFunction(() => document.getElementById("onboardOverlay").hidden, {
      timeout: 2000
    });
    const persisted = await page.evaluate(() => localStorage.getItem("aetheria.onboarded"));
    check("Pular: fecha overlay", true);
    check(
      "Pular: persiste localStorage",
      !!persisted && persisted.includes('"version":"1"'),
      `valor=${persisted}`
    );
    await ctx.close();
  }

  // 3) navegacao Proximo pelos 4 passos
  {
    const { ctx, page } = await newPage();
    await page.waitForSelector("#onboardOverlay:not([hidden])", { timeout: 3000 });
    const labels = [];
    for (let i = 0; i < 4; i++) {
      const txt = await page.locator("#onboardNext").textContent();
      labels.push(txt);
      if (i < 3) await page.click("#onboardNext");
    }
    check(
      "3 primeiros labels sao 'Proximo'",
      labels.slice(0, 3).every((l) => l === "Próximo"),
      `labels=${JSON.stringify(labels)}`
    );
    check(
      "ultimo label e 'Comecar a explorar'",
      labels[3] === "Começar a explorar",
      `label=${labels[3]}`
    );
    // click final deve fechar
    await page.click("#onboardNext");
    await page.waitForFunction(() => document.getElementById("onboardOverlay").hidden, {
      timeout: 2000
    });
    check("ultimo click fecha o overlay", true);
    await ctx.close();
  }

  // 4) Esc fecha
  {
    const { ctx, page } = await newPage();
    await page.waitForSelector("#onboardOverlay:not([hidden])", { timeout: 3000 });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.getElementById("onboardOverlay").hidden, {
      timeout: 2000
    });
    check("Esc fecha overlay", true);
    await ctx.close();
  }

  // 5) Click no backdrop fecha
  {
    const { ctx, page } = await newPage();
    await page.waitForSelector("#onboardOverlay:not([hidden])", { timeout: 3000 });
    // clica no canto superior esquerdo (overlay, nao no card)
    await page.locator("#onboardOverlay").click({ position: { x: 5, y: 5 } });
    await page.waitForFunction(() => document.getElementById("onboardOverlay").hidden, {
      timeout: 2000
    });
    check("Click no backdrop fecha", true);
    await ctx.close();
  }

  // 6) Ja onboarded: overlay NAO aparece
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      storageState: {
        cookies: [],
        origins: [
          {
            origin: BASE,
            localStorage: [
              { name: "aetheria.onboarded", value: JSON.stringify({ version: "1", at: 0 }) }
            ]
          }
        ]
      }
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const hidden = await page.locator("#onboardOverlay").isHidden();
    check("Ja onboarded: overlay NAO aparece", hidden);
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
