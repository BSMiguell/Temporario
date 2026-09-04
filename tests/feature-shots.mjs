// tests/feature-shots.mjs
// Capturas dedicadas das features novas (Q4/2026) que faltam no README.
// Saída em docs/screenshots/ (versionadas) com nome prefixado por `feat-`.
// Pré-requisito: servidor local em :8080 (python -m http.server 8080).
//
// Execução: `node tests/feature-shots.mjs`

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "screenshots");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:8080";
const DESKTOP = { width: 1600, height: 1000 };
const MOBILE = { width: 390, height: 844 };

const log = (msg) => console.log(`  ${msg}`);

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  log(`📸 ${name}`);
}

// Garante onboarding não vai pular pra próxima visita
async function onboardDone(page) {
  await page.evaluate(() => {
    try { localStorage.setItem("aetheria.onboarded", JSON.stringify({ version: "1" })); } catch {}
  });
}
async function onboardReset(page) {
  await page.evaluate(() => {
    try { localStorage.removeItem("aetheria.onboarded"); } catch {}
  });
}

async function main() {
  const browser = await chromium.launch();
  const taken = [];
  const fail = (label, e) => console.log(`  ⚠️  ${label}: ${e.message.split("\n")[0]}`);
  try {
    // === DESKTOP ===
    const ctxD = await browser.newContext({ viewport: DESKTOP, locale: "pt-BR" });
    const page = await ctxD.newPage();

    // 1. PWA install button / toast instrutivo iOS
    await page.goto(`${BASE}/index.html?pwa=ios`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "feat-pwa-install-toast.jpg");
    taken.push("feat-pwa-install-toast.jpg");

    // 2. Onboarding 4 passos (estado inicial)
    await page.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
    await onboardReset(page);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "feat-onboarding-passo1.jpg");
    taken.push("feat-onboarding-passo1.jpg");

    // Avançar 1 passo (botão "Próximo" / "Next" / "→")
    try {
      const next = page.getByRole("button", { name: /pr(ó|o)ximo|next|→/i }).first();
      if (await next.count()) {
        await next.click();
        await page.waitForTimeout(700);
        await shot(page, "feat-onboarding-passo2.jpg");
        taken.push("feat-onboarding-passo2.jpg");
      }
    } catch (e) { fail("onboarding passo 2", e); }
    await onboardDone(page);

    // 3. Daily Featured 3 períodos — o site já mostra 3 cards por período
    //    Basta ir para a home e capturar o hero
    await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "feat-daily-featured-3p.jpg");
    taken.push("feat-daily-featured-3p.jpg");

    // 4. Modal com 3 botões de share (share / copy / embed)
    try {
      const card = page.locator(".character-card").first();
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await card.click();
      await page.waitForTimeout(1500);
      // Scroll pro rodapé do modal pra mostrar os 3 botões de share
      await page.evaluate(() => {
        const modal = document.querySelector("#modal, .modal, [role='dialog']");
        if (modal) modal.scrollTop = modal.scrollHeight;
      });
      await page.waitForTimeout(500);
      await shot(page, "feat-modal-share-3botoes.jpg");
      taken.push("feat-modal-share-3botoes.jpg");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    } catch (e) { fail("modal share", e); }

    // 5. Dialog "Sobre" — #aboutLink
    try {
      await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
      await page.locator("#aboutLink").click();
      await page.waitForTimeout(800);
      await shot(page, "feat-about-dialog.jpg");
      taken.push("feat-about-dialog.jpg");
      await page.keyboard.press("Escape");
    } catch (e) { fail("about dialog", e); }

    // 6. Skip-link a11y
    await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(400);
    await shot(page, "feat-skiplink.jpg");
    taken.push("feat-skiplink.jpg");

    // 7. Paleta Ctrl+K
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(600);
    await shot(page, "feat-palette.jpg");
    taken.push("feat-palette.jpg");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // 8. Mapa com filtro de raça
    await page.goto(`${BASE}/Mapa_Aetheria.html#04_Onis`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await shot(page, "feat-mapa-filtro-raca.jpg");
    taken.push("feat-mapa-filtro-raca.jpg");

    // 9. Linha do tempo
    await page.goto(`${BASE}/Linha_do_Tempo.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "feat-linha-do-tempo.jpg");
    taken.push("feat-linha-do-tempo.jpg");

    await ctxD.close();

    // === MOBILE ===
    const ctxM = await browser.newContext({
      viewport: MOBILE,
      locale: "pt-BR",
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const m = await ctxM.newPage();

    // 10. Onboarding mobile
    await m.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
    await onboardReset(m);
    await m.reload({ waitUntil: "networkidle" });
    await m.waitForTimeout(1500);
    await shot(m, "feat-mob-onboarding.jpg");
    taken.push("feat-mob-onboarding.jpg");
    await onboardDone(m);

    // 11. Cards no mobile filtrados por Demônios
    await m.goto(`${BASE}/index.html#g=05_Demonios`, { waitUntil: "networkidle" });
    await m.waitForTimeout(1500);
    await shot(m, "feat-mob-cards-demonios.jpg");
    taken.push("feat-mob-cards-demonios.jpg");

    // 12. Modal no mobile
    try {
      const cardM = m.locator(".character-card").first();
      await cardM.scrollIntoViewIfNeeded();
      await cardM.click();
      await m.waitForTimeout(1500);
      await shot(m, "feat-mob-modal.jpg");
      taken.push("feat-mob-modal.jpg");
      await m.keyboard.press("Escape");
      await m.waitForTimeout(400);
    } catch (e) { fail("modal mobile", e); }

    // 13. Paleta no mobile
    try {
      await m.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
      await m.waitForTimeout(800);
      await m.keyboard.press("/");
      await m.waitForTimeout(600);
      await shot(m, "feat-mob-palette.jpg");
      taken.push("feat-mob-palette.jpg");
      await m.keyboard.press("Escape");
    } catch (e) { fail("palette mobile", e); }

    // 14. Mapa no mobile
    await m.goto(`${BASE}/Mapa_Aetheria.html`, { waitUntil: "networkidle" });
    await m.waitForTimeout(2500);
    await shot(m, "feat-mob-mapa.jpg");
    taken.push("feat-mob-mapa.jpg");

    // 15. Linha do tempo no mobile
    await m.goto(`${BASE}/Linha_do_Tempo.html`, { waitUntil: "networkidle" });
    await m.waitForTimeout(1500);
    await shot(m, "feat-mob-linha-do-tempo.jpg");
    taken.push("feat-mob-linha-do-tempo.jpg");

    // 16. About no mobile
    try {
      await m.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
      await m.locator("#aboutLink").click();
      await m.waitForTimeout(800);
      await shot(m, "feat-mob-about.jpg");
      taken.push("feat-mob-about.jpg");
    } catch (e) { fail("about mobile", e); }

    await ctxM.close();
  } finally {
    await browser.close();
  }

  console.log(`\n✅ ${taken.length} capturas geradas em docs/screenshots/:`);
  for (const t of taken) console.log(`   - ${t}`);
}

main().catch((e) => {
  console.error("❌ Falha:", e.message);
  process.exit(1);
});
