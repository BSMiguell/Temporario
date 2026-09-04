// make-og-cover.mjs — renderiza og-cover.svg para og-cover.png 1200x630
// (a versão .jpg é gerada por scripts/make-og-cover.ps1 via System.Drawing)
// Uso: node tests/make-og-cover.mjs
import { chromium } from "playwright";
import { existsSync } from "node:fs";

const SVG = "assets/og-cover.svg";
const OUT_PNG = "assets/og-cover.png";

if (!existsSync(SVG)) {
  console.error(`❌ ${SVG} não existe`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const html = `<!doctype html><html><body style="margin:0;padding:0;background:#1a120e">
  <img src="file:///${process.cwd().replace(/\\/g, "/")}/${SVG}" width="1200" height="630">
</body></html>`;
await page.setContent(html);
await page.setViewportSize({ width: 1200, height: 630 });
await page.waitForLoadState("networkidle");
await page.locator("img").screenshot({ path: OUT_PNG });
console.log(`✅ ${OUT_PNG} (1200x630)`);

await browser.close();
