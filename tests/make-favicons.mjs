// make-favicons.mjs — renderiza assets/favicon.svg em PNGs de vários tamanhos
// Uso:   node tests/make-favicons.mjs
import { chromium } from "playwright";
import { existsSync } from "node:fs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const targets = [
  { svg: "assets/favicon.svg", out: "assets/favicon-32.png", size: 32 },
  { svg: "assets/favicon.svg", out: "assets/favicon-192.png", size: 192 },
  { svg: "assets/favicon.svg", out: "assets/apple-touch-icon.png", size: 180 }
];

for (const t of targets) {
  if (!existsSync(t.svg)) {
    console.error(`❌ ${t.svg} não existe`);
    continue;
  }
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
    <div style="width:${t.size}px;height:${t.size}px;display:flex;align-items:center;justify-content:center">
      <img src="file:///${process.cwd()}/${t.svg}" width="${t.size}" height="${t.size}">
    </div></body></html>`;
  await page.setContent(html);
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.waitForLoadState("networkidle");
  await page.locator("img").screenshot({ path: t.out, omitBackground: true });
  console.log(`✅ ${t.out} (${t.size}x${t.size})`);
}

await browser.close();
