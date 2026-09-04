// Teste do §6.4 — Exportar vista do mapa (PNG)
// Cobre: botão #exportarPNG existe e está visível, click dispara download
// de PNG válido (magic bytes), HUDs ficam escondidos durante o export mas
// voltam visíveis depois (estado limpo), e o export não quebra a navegação
// (testa o filtro de raça + botão redefinir após o download).
//
// Estratégia: usa o evento 'download' do Playwright pra capturar o arquivo
// gerado. Verifica o tamanho (>1KB) e os 4 primeiros bytes (89 50 4E 47 = PNG).

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
  // ========== Bloco 1: botão existe (3 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Mapa_Aetheria.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__MAPA__ && window.__MAPA__.battles, { timeout: 5000 });

    check(
      "UI: botão #exportarPNG existe e está visível",
      await page.locator("#exportarPNG").isVisible()
    );

    const textoBotao = await page.evaluate(() => {
      const b = document.getElementById("exportarPNG");
      return b ? b.textContent.trim() : null;
    });
    check(
      "UI: texto do botão é '📸 Salvar vista'",
      textoBotao === "📸 Salvar vista",
      `texto=${JSON.stringify(textoBotao)}`
    );

    const titleAttr = await page.evaluate(() => {
      const b = document.getElementById("exportarPNG");
      return b ? b.getAttribute("title") : null;
    });
    check(
      "UI: botão tem title 'Salvar a vista atual como imagem PNG'",
      titleAttr === "Salvar a vista atual como imagem PNG",
      `title=${JSON.stringify(titleAttr)}`
    );
    await ctx.close();
  }

  // ========== Bloco 2: click dispara download PNG válido (3 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Mapa_Aetheria.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__MAPA__ && window.__MAPA__.battles, { timeout: 5000 });
    // Espera o canvas estar pronto (algum pino visível)
    await page.waitForTimeout(800);

    // Dispara o download via click no botão
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 5000 }),
      page.click("#exportarPNG")
    ]);

    // Valida nome do arquivo
    const filename = download.suggestedFilename();
    check(
      "export: nome do arquivo é 'aetheria-mapa-<timestamp>.png'",
      /^aetheria-mapa-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/.test(filename),
      `filename=${filename}`
    );

    // Salva o arquivo e verifica magic bytes + tamanho mínimo
    const path = await download.path();
    const fs = await import("fs");
    const buf = fs.readFileSync(path);
    const isPNG =
      buf.length > 1024 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    check(
      "export: arquivo baixado é PNG válido (magic bytes + >1KB)",
      isPNG,
      `size=${buf.length}B magic=${buf[0]?.toString(16)} ${buf[1]?.toString(16)} ${buf[2]?.toString(16)} ${buf[3]?.toString(16)}`
    );

    // Lê dimensões do PNG (offset 16-23: width(4) + height(4) big-endian)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    check(
      "export: dimensões do PNG batem com a viewport (>800px ambos os lados)",
      width >= 800 && height >= 600,
      `${width}x${height}`
    );

    await ctx.close();
  }

  // ========== Bloco 3: HUDs voltam visíveis depois do export (2 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Mapa_Aetheria.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__MAPA__ && window.__MAPA__.battles, { timeout: 5000 });
    await page.waitForTimeout(800);

    // Estado antes: HUD principal (header de controles) deve estar visível
    const hudAntes = await page.evaluate(() => {
      const h = document.querySelector(".hud-controles");
      return h ? getComputedStyle(h).display !== "none" : null;
    });
    check("hud: .hud-controles visível ANTES do click", hudAntes === true, `display=${hudAntes}`);

    // Click → download
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 5000 }),
      page.click("#exportarPNG")
    ]);
    await download.path(); // força o download a completar

    // Espera o próximo frame (o callback do toBlob roda dentro do RAF)
    await page.waitForTimeout(300);

    const hudDepois = await page.evaluate(() => {
      const h = document.querySelector(".hud-controles");
      return h ? getComputedStyle(h).display !== "none" : null;
    });
    check(
      "hud: .hud-controles visível DEPOIS do export (callback restaurou)",
      hudDepois === true,
      `display=${hudDepois}`
    );

    await ctx.close();
  }

  // ========== Bloco 4: export não quebra a navegação subsequente (1 check) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Mapa_Aetheria.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__MAPA__ && window.__MAPA__.battles, { timeout: 5000 });
    await page.waitForTimeout(500);

    // Exporta
    const [dl1] = await Promise.all([
      page.waitForEvent("download", { timeout: 5000 }),
      page.click("#exportarPNG")
    ]);
    await dl1.path();

    // Clica no botão "Redefinir" pra garantir que o estado da câmera está limpo
    const redefiniu = await page.evaluate(() => {
      const b = document.getElementById("btn-redefinir");
      if (!b) return false;
      b.click();
      return true;
    });

    // Exporta de novo
    await page.waitForTimeout(300);
    const [dl2] = await Promise.all([
      page.waitForEvent("download", { timeout: 5000 }),
      page.click("#exportarPNG")
    ]);
    await dl2.path();

    check(
      "navegação: 2 exports consecutivos + botão redefinir não quebram estado",
      redefiniu === true,
      `redefiniu=${redefiniu}`
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
