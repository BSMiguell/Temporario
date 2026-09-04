// analyze.mjs — análise técnica do site para embasar o plano de melhorias
// Uso:   node tests/analyze.mjs
import { chromium } from "playwright";
import { readFileSync, statSync } from "node:fs";

const BASE = "http://localhost:8080";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

console.log("📊 ANÁLISE TÉCNICA DO AETHERIA CODEX\n");

// ============ 1. CARGA ============
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const timings = await page.evaluate(() => {
  const t = performance.getEntriesByType("navigation")[0];
  const paints = performance.getEntriesByType("paint");
  return {
    ttfb: Math.round(t.responseStart - t.requestStart),
    dom: Math.round(t.domContentLoadedEventEnd - t.startTime),
    load: Math.round(t.loadEventEnd - t.startTime),
    fcp: paints.find((p) => p.name === "first-contentful-paint")?.startTime | 0
  };
});
console.log("⏱️  TIMINGS");
console.log("   TTFB:", timings.ttfb, "ms");
console.log("   DOM ready:", timings.dom, "ms");
console.log("   Load complete:", timings.load, "ms");
console.log("   First Contentful Paint:", Math.round(timings.fcp), "ms");

// ============ 2. RECURSOS ============
const resources = await page.evaluate(() => {
  const entries = performance.getEntriesByType("resource");
  const byType = {};
  for (const e of entries) {
    const ext = e.name.split(".").pop().split("?")[0].slice(0, 4);
    byType[ext] = (byType[ext] || 0) + 1;
  }
  const images = entries.filter(
    (e) => e.initiatorType === "img" || /\.(png|jpg|webp|svg)$/i.test(e.name)
  );
  return {
    total: entries.length,
    byType,
    images: images.length,
    imageTotalKB: Math.round(images.reduce((s, e) => s + (e.transferSize || 0), 0) / 1024),
    biggestImg: images.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0]
  };
});
console.log("\n📦 RECURSOS");
console.log("   Total:", resources.total);
console.log("   Por tipo:", resources.byType);
console.log("   Imagens:", resources.images, "(", resources.imageTotalKB, "KB)");
if (resources.biggestImg) {
  console.log(
    "   Maior imagem:",
    resources.biggestImg.name.split("/").pop(),
    "—",
    Math.round((resources.biggestImg.transferSize || 0) / 1024),
    "KB"
  );
}

// ============ 3. META / SEO ============
const meta = await page.evaluate(() => ({
  viewport: !!document.querySelector('meta[name="viewport"]'),
  description: document.querySelector('meta[name="description"]')?.content || null,
  og: document.querySelectorAll('meta[property^="og:"]').length,
  twitter: document.querySelectorAll('meta[name^="twitter:"]').length,
  preload: document.querySelectorAll('link[rel="preload"]').length,
  preconnect: document.querySelectorAll('link[rel="preconnect"]').length,
  manifest: !!document.querySelector('link[rel="manifest"]'),
  favicon: document.querySelectorAll('link[rel*="icon"]').length,
  canonical: document.querySelector('link[rel="canonical"]')?.href || null
}));
console.log("\n🔎 META / SEO");
console.log("   ", meta);

// ============ 4. A11Y ============
const a11y = await page.evaluate(() => {
  return {
    h1: document.querySelectorAll("h1").length,
    buttons: document.querySelectorAll("button").length,
    buttonsNoLabel: Array.from(document.querySelectorAll("button")).filter(
      (b) => !b.getAttribute("aria-label") && !b.textContent.trim()
    ).length,
    imgsNoAlt: document.querySelectorAll("img:not([alt])").length,
    lang: document.documentElement.lang,
    skipLink: !!document.querySelector('a[href^="#"][class*="skip"], .skip-link'),
    landmarks: {
      header: document.querySelectorAll('header, [role="banner"]').length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      main: document.querySelectorAll('main, [role="main"]').length,
      footer: document.querySelectorAll('footer, [role="contentinfo"]').length
    }
  };
});
console.log("\n♿ A11Y");
console.log("   ", a11y);

// ============ 5. PÁGINAS DE RAÇA ============
const racaSample = await page.evaluate(() => {
  return Array.from(document.querySelectorAll(".race-card, [data-race-card], a[href*='racas/']"))
    .slice(0, 5)
    .map((el) => ({ tag: el.tagName, href: el.href, text: el.textContent?.slice(0, 40) }));
});
console.log("\n📄 PÁGINAS DE RAÇA");
console.log("   Amostra de links:", racaSample);

// ============ 6. TAMANHO DO HTML/JSON ============
try {
  const htmlSize = readFileSync("index.html").length;
  const jsonSize = statSync("characters-api.json").size;
  console.log("\n📏 TAMANHO");
  console.log("   index.html:", Math.round(htmlSize / 1024), "KB");
  console.log("   characters-api.json:", Math.round(jsonSize / 1024), "KB");
} catch {}

// ============ 7. FUNCIONALIDADES ENCONTRADAS ============
const features = await page.evaluate(() => {
  return {
    hasCtrlKHint: !!document.querySelector('[class*="palette"], [id*="palette"]'),
    hasSearch: !!document.querySelector(
      'input[type="search"], input[type="text"][placeholder*="busca" i]'
    ),
    hasFiltros: document.querySelectorAll('[class*="filter"], [class*="chip"]').length,
    hasTemaToggle: !!document.querySelector('[id*="theme"], [class*="theme-btn"]'),
    hasMapa: !!document.querySelector('a[href*="Mapa"]'),
    hasFavoritos: !!document.querySelector('[id*="fav"], [class*="fav"], [class*="favorite"]'),
    hasPWA: !!document.querySelector('link[rel="manifest"]'),
    hasRSS: !!document.querySelector('link[rel="alternate"][type="application/rss+xml"]'),
    hasServiceWorker: !!document.querySelector(
      'script[src*="sw.js"], script[src*="service-worker"]'
    )
  };
});
console.log("\n⚙️  FUNCIONALIDADES");
console.log("   ", features);

await browser.close();
console.log("\n✅ Análise completa.");
