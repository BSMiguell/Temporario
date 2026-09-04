// Teste do §4.4 — Compartilhar/Embed do modal
// Cobre: 3 botões de share (SVG #modalShare, texto #modalShareBtn, novo
// #embedBtn), click → copy/Web Share API correto, toast de feedback,
// fallback quando clipboard.writeText rejeita.
//
// Limitação: o `navigator.clipboard.readText` exige permissão no Playwright.
// Usamos `permissions: ["clipboard-read", "clipboard-write"]` no context.

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
  // ========== Bloco 1: UI — 3 botões de share (3 checks) ==========
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      permissions: ["clipboard-read", "clipboard-write"]
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html#Aokiji", { waitUntil: "load" });
    await page.waitForSelector("#embedBtn", { timeout: 5000 });

    // #modalShare (SVG icon) está sempre presente (linha 605 do index.html)
    check(
      "UI: #modalShare (SVG, top-right do modal) visível",
      await page.locator("#modalShare").isVisible()
    );

    // #modalShareBtn (texto "🔗 Copiar link")
    const shareBtnText = await page.evaluate(() =>
      document.getElementById("modalShareBtn")?.textContent?.trim()
    );
    check(
      "UI: #modalShareBtn tem texto '🔗 Copiar link'",
      shareBtnText === "🔗 Copiar link",
      `text=${JSON.stringify(shareBtnText)}`
    );

    // #embedBtn (NOVO, §4.4)
    const embedBtnText = await page.evaluate(() =>
      document.getElementById("embedBtn")?.textContent?.trim()
    );
    check(
      "UI: #embedBtn tem texto '📋 Embed' (NOVO, §4.4)",
      embedBtnText === "📋 Embed",
      `text=${JSON.stringify(embedBtnText)}`
    );
    await ctx.close();
  }

  // ========== Bloco 2: 🔗 Copiar link funciona (2 checks) ==========
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      permissions: ["clipboard-read", "clipboard-write"]
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html#Aokiji", { waitUntil: "load" });
    await page.waitForSelector("#embedBtn", { timeout: 5000 });

    await page.click("#modalShareBtn");
    await page.waitForTimeout(200);

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    // O openModal faz history.replaceState com char.slug || id || name,
    // entao o hash final eh o slug canonico (01_Humanos_Aokiji).
    // Aceita os 2: slug (preferido pelo site) ou id (test entrou com).
    check(
      "share: 🔗 Copiar link gravou a URL completa com #<slug-ou-id-do-Aokiji>",
      /^https?:\/\/.+#(01_Humanos_Aokiji|Aokiji)$/.test(clip),
      `clip=${JSON.stringify(clip)}`
    );

    // Toast aparece (procura o container #toastContainer e seu primeiro filho)
    const toastVisivel = await page.evaluate(() => {
      // showToast cria divs dentro de #toastContainer
      const c = document.getElementById("toastContainer");
      if (!c) return null;
      // Pega só o ÚLTIMO toast (mais recente)
      const last = c.lastElementChild;
      return last ? last.textContent.trim() : null;
    });
    check(
      "share: toast '🔗 Link do personagem copiado!' aparece",
      toastVisivel && /copiado/i.test(toastVisivel),
      `toast=${JSON.stringify(toastVisivel)}`
    );
    await ctx.close();
  }

  // ========== Bloco 3: 📋 Embed funciona (2 checks) ==========
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      permissions: ["clipboard-read", "clipboard-write"]
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html#Aokiji", { waitUntil: "load" });
    await page.waitForSelector("#embedBtn", { timeout: 5000 });

    await page.click("#embedBtn");
    await page.waitForTimeout(200);

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    // Aceita o slug canonico OU o id (mesma logica do share link).
    const isIframe =
      clip.startsWith("<iframe ") &&
      clip.endsWith("</iframe>") &&
      /src="https?:\/\/[^"]+#(01_Humanos_Aokiji|Aokiji)"/.test(clip) &&
      /width="400"/.test(clip) &&
      /height="500"/.test(clip) &&
      /loading="lazy"/.test(clip) &&
      /title="Aokiji — Aetheria Codex"/.test(clip) &&
      /style="border-radius:8px;border:0"/.test(clip);
    check(
      "embed: clipboard recebe <iframe> 400x500 com #<slug-ou-id>, loading=lazy, title",
      isIframe,
      `clip=${JSON.stringify(clip).slice(0, 200)}`
    );

    // Toast "📋 Embed copiado!" aparece
    const toastVisivel = await page.evaluate(() => {
      const c = document.getElementById("toastContainer");
      if (!c) return null;
      const last = c.lastElementChild;
      return last ? last.textContent.trim() : null;
    });
    check(
      "embed: toast '📋 Embed copiado!' aparece",
      toastVisivel && /embed.*copiado/i.test(toastVisivel),
      `toast=${JSON.stringify(toastVisivel)}`
    );
    await ctx.close();
  }

  // ========== Bloco 4: Web Share API (mock, 1 check) ==========
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      permissions: ["clipboard-read", "clipboard-write"]
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html#Aokiji", { waitUntil: "load" });
    await page.waitForSelector("#embedBtn", { timeout: 5000 });

    // Mocka navigator.share antes do click
    await page.evaluate(() => {
      window.__shareCalled = null;
      navigator.share = (data) => {
        window.__shareCalled = data;
        return Promise.resolve();
      };
    });

    await page.click("#modalShare");
    await page.waitForTimeout(200);

    const called = await page.evaluate(() => window.__shareCalled);
    // O modalShare usa `${char.id}` (linha 2759) que pode ser slug ou id
    // dependendo de qual hook foi usado. Aqui o openModal aplicou replaceState
    // com slug, mas o `url` montado no handler usa `currentModalChar.id || name`.
    // O `currentModalChar.id` original eh "Aokiji" (do spread ...c).
    check(
      "share: #modalShare (SVG) chama navigator.share com {title, text, url}",
      called &&
        typeof called.title === "string" &&
        /Aokiji/.test(called.title) &&
        typeof called.url === "string" &&
        /#(Aokiji|01_Humanos_Aokiji)$/.test(called.url),
      `called=${JSON.stringify(called)?.slice(0, 200)}`
    );
    await ctx.close();
  }

  // ========== Bloco 5: Fallback sem clipboard (1 check) ==========
  {
    const ctx = await browser.newContext({
      serviceWorkers: "block",
      permissions: ["clipboard-read", "clipboard-write"]
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html#Aokiji", { waitUntil: "load" });
    await page.waitForSelector("#embedBtn", { timeout: 5000 });

    // Mocka clipboard.writeText pra rejeitar
    await page.evaluate(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error("blocked"));
    });

    await page.click("#modalShareBtn");
    await page.waitForTimeout(300);

    const toastVisivel = await page.evaluate(() => {
      const c = document.getElementById("toastContainer");
      if (!c) return null;
      const last = c.lastElementChild;
      return last ? last.textContent.trim() : null;
    });
    check(
      "fallback: erro de clipboard mostra toast 'Não consegui copiar o link 😅'",
      toastVisivel && /não consegui copiar/i.test(toastVisivel),
      `toast=${JSON.stringify(toastVisivel)}`
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
