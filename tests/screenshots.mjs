// screenshots.mjs — tira capturas de tela do Aetheria Codex atualizado (489 chars)
// Uso:  node tests/screenshots.mjs
// Requer:  servidor local em :8080 (python -m http.server 8080 ou similar)
//
// Saída: tests/screenshots/*.png (vai para o README se você quiser)
//
// As imagens saem em PNG (qualidade máxima) — diferentes das .jpg em
// docs/screenshots/ (que estão no repo). PNG aqui é só material de
// inspeção/debug, não versionar.

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "screenshots");
const BASE = process.env.AETHERIA_URL || "http://localhost:8080";
const VIEWPORT = { width: 1600, height: 1000 }; // mesmas dimensões das .jpg de 25/08

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const shots = [
  // [nome,         path,                 fullPage, antes?]
  ["index-hero", "/", false, null],
  ["index-cards", "/#g=", false, null], // grade inicial
  ["index-filtros", "/#g=04_Onis", false, null], // filtro Onis
  ["index-modal", "/#g=05_Demonios", false, "Aatrox-V-1"], // deep-link no Aatrox
  ["index-palette", "/", false, "ctrl+k"], // Ctrl+K aberto
  ["mapa", "/Mapa_Aetheria.html", false, null]
];

// W6.2: capturas mobile (375x812 — iPhone X) para QA das páginas de raça.
// W7.6: 2 capturas extras com overlay de ritual aberto.
// W8.6: 5 capturas extras — uma por nova raça do W8, todas com overlay de ritual aberto.
const shotsMobile = [
  // [nome,             path,                 viewport,                  action?]
  // W6 (3)
  ["mob-demonios", "/racas/demonios.html", { width: 375, height: 812 }, null],
  ["mob-onis", "/racas/onis.html", { width: 375, height: 812 }, null],
  ["mob-humanos", "/racas/humanos.html", { width: 375, height: 812 }, null], // controle genérico
  // W7 (2)
  ["mob-demonios-ritual", "/racas/demonios.html", { width: 375, height: 812 }, "ritual"],
  ["mob-onis-ritual", "/racas/onis.html", { width: 375, height: 812 }, "ritual"],
  // W8 (5 — uma por nova raça)
  ["mob-humanos-ritual", "/racas/humanos.html", { width: 375, height: 812 }, "ritual"],
  ["mob-semideuses-ritual", "/racas/semideuses.html", { width: 375, height: 812 }, "ritual"],
  ["mob-deuses-ritual", "/racas/deuses.html", { width: 375, height: 812 }, "ritual"],
  ["mob-monstros-ritual", "/racas/monstros.html", { width: 375, height: 812 }, "ritual"],
  ["mob-meiosangue-ritual", "/racas/meiosangue.html", { width: 375, height: 812 }, "ritual"]
];

const browser = await chromium.launch({ headless: true });
try {
  for (const [name, path, fullPage, action] of shots) {
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    console.log(`📸 ${name} → ${BASE}${path}`);

    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 15000 });

    if (action === "Aatrox-V-1") {
      // deep-link no personagem: o site já abre o modal via hash
      await page
        .waitForSelector(".modal.open, [data-modal-open]", { timeout: 5000 })
        .catch(() => {});
      await page.waitForTimeout(800);
    } else if (action === "ctrl+k") {
      // abre a paleta de comandos
      await page.keyboard.press("Control+K");
      await page.waitForTimeout(500);
    }

    const out = join(OUT, `${name}.png`);
    await page.screenshot({ path: out, fullPage });
    console.log(`   salvo: ${out}`);
    await ctx.close();
  }

  // ---- W6.2: mobile shots (W7.6: suporta action opcional) ----
  for (const [name, path, viewport, action] of shotsMobile) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    console.log(
      `📱 ${name} → ${BASE}${path} (${viewport.width}x${viewport.height})${action ? ` [action=${action}]` : ""}`
    );

    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000); // partículas + reveal

    if (action === "ritual") {
      // W7.6: clica 1º pill de ritual e espera o overlay abrir antes do shot
      const hasPicker = (await page.locator("#ritualPicker .ritual-pill").count()) > 0;
      if (hasPicker) {
        await page.locator("#ritualPicker .ritual-pill").first().click();
        await page.waitForSelector(".ritual-overlay.is-open", { timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(500); // efeito tem 1-2s de animação
      } else {
        // fallback W6
        await page
          .locator("#invocarRitualBtn")
          .first()
          .click()
          .catch(() => {});
        await page.waitForSelector(".ritual-overlay.is-open", { timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(500);
      }
    }

    const out = join(OUT, `${name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`   salvo: ${out}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(`\n✅ ${shots.length + shotsMobile.length} screenshots em ${OUT}`);
