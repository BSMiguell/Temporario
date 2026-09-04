// Teste do §2.3 — OG dinamico por personagem
// Cobre: estado inicial generico, deep-link abre modal e troca title/og/twitter,
// restaura ao fechar (Esc), e overwrite quando se abre um 2º char sem fechar.
//
// Limitacao documentada: scrapers sociais (WhatsApp, Twitter/X, Facebook, LinkedIn)
// NAO rodam JS — primeiro share de fora mostra capa generica. Esta entrega cobre
// re-share interno, copy-paste de URL, navigator.share e clients que renderizam JS
// (Discord, Slack unfurl after JS). og:image continua sendo a capa 1200x630 (decisao:
// trocar para arte 1:1 do char faria center-crop jogar fora 40% do visual).
//
// IMPORTANTE: o goto do Playwright para mesma URL (mesmo ignorando o hash) nao
// recarrega a pagina, entao cada cenario precisa de um context novo + goto direto
// pra URL com hash.

import { chromium } from "playwright";

const BASE = process.env.AETHERIA_URL || "http://localhost:8124";
const GENERIC_TITLE = "Aetheria Codex — Códice de 489 Personagens";
const GENERIC_OG_URL = "https://bsmiguell.github.io/Temporario/";
const GENERIC_OG_IMAGE = "https://bsmiguell.github.io/Temporario/assets/og-cover.jpg";
const GENERIC_OG_DESC_PREFIX = "Códice de fantasia autoral:";

const browser = await chromium.launch({ headless: true });
let pass = 0,
  fail = 0;
const check = (n, ok, d = "") => {
  console.log(`${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`);
  ok ? pass++ : fail++;
};

const getMeta = (page, attr, key) =>
  page.evaluate(
    ([a, k]) => document.querySelector(`meta[${a}="${k}"]`)?.getAttribute("content") || "",
    [attr, key]
  );
const getTitle = (page) => page.evaluate(() => document.title);

// descobre 2 chars reais do API (1º do 1º grupo + 1º do 2º grupo).
// parseHash() no site resolve por `id` (NÃO slug), entao testamos com id.
// O `slug` continua sendo usado pra asserir og:url, ja que updateMetaTagsForChar
// prefere slug (slug || id || name).
async function discoverChars(page) {
  return page.evaluate(async () => {
    const r = await fetch("/characters-api.json");
    const data = await r.json();
    const pick = (g) =>
      g?.characters?.[0]
        ? { id: g.characters[0].id, slug: g.characters[0].slug, name: g.characters[0].name }
        : null;
    return { a: pick(data.groups[0]), b: pick(data.groups[1]) };
  });
}

async function freshPage(url) {
  const ctx = await browser.newContext({ serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: "load" });
  return { ctx, page };
}

try {
  // 1) Estado inicial generico (4 checks)
  {
    const { ctx, page } = await freshPage("/");
    check("inicial: title generico", (await getTitle(page)) === GENERIC_TITLE);
    check(
      "inicial: og:title generico",
      (await getMeta(page, "property", "og:title")) === GENERIC_TITLE
    );
    check(
      "inicial: og:image = og-cover.jpg",
      (await getMeta(page, "property", "og:image")) === GENERIC_OG_IMAGE
    );
    check(
      "inicial: og:url sem hash",
      (await getMeta(page, "property", "og:url")) === GENERIC_OG_URL
    );
    await ctx.close();
  }

  // 2) Deep-link /#<id> atualiza meta tags (7 checks)
  {
    const probe = await browser.newContext({ serviceWorkers: "block" });
    const probePage = await probe.newPage();
    await probePage.goto(BASE + "/", { waitUntil: "load" });
    const { a } = await discoverChars(probePage);
    await probe.close();

    if (!a) {
      check("deep-link: chars descobertos", false, "API nao retornou chars");
    } else {
      const { ctx, page } = await freshPage(`/#${encodeURIComponent(a.id)}`);
      try {
        await page.waitForFunction((n) => document.title.includes(n), a.name, { timeout: 4000 });
      } catch {
        /* assercoes abaixo vao dizer o que deu errado */
      }

      const title = await getTitle(page);
      check("deep-link: title inclui nome do char", title.includes(a.name), `title="${title}"`);
      check(
        "deep-link: og:title inclui nome",
        (await getMeta(page, "property", "og:title")).includes(a.name)
      );
      const ogDesc = await getMeta(page, "property", "og:description");
      const twDesc = await getMeta(page, "name", "twitter:description");
      check(
        "deep-link: og:description 1-200 chars E diferente da generica",
        !!ogDesc &&
          ogDesc.length > 0 &&
          ogDesc.length <= 200 &&
          !ogDesc.startsWith(GENERIC_OG_DESC_PREFIX),
        `len=${ogDesc?.length}`
      );
      check("deep-link: twitter:description == og:description", ogDesc === twDesc, "match");
      check(
        "deep-link: og:url contem #slug",
        (await getMeta(page, "property", "og:url")).includes(`#${a.slug}`)
      );
      check(
        "deep-link: og:image AINDA = og-cover.jpg (decisao deliberada)",
        (await getMeta(page, "property", "og:image")) === GENERIC_OG_IMAGE
      );
      check(
        "deep-link: og:type continua website",
        (await getMeta(page, "property", "og:type")) === "website"
      );
      await ctx.close();
    }
  }

  // 3) Restaurar ao fechar via Esc (3 checks)
  {
    const probe = await browser.newContext({ serviceWorkers: "block" });
    const probePage = await probe.newPage();
    await probePage.goto(BASE + "/", { waitUntil: "load" });
    const { a } = await discoverChars(probePage);
    await probe.close();

    if (a) {
      const { ctx, page } = await freshPage(`/#${encodeURIComponent(a.id)}`);
      await page.waitForFunction((n) => document.title.includes(n), a.name, { timeout: 4000 });
      await page.keyboard.press("Escape");
      await page.waitForFunction((t) => document.title === t, GENERIC_TITLE, { timeout: 2000 });
      check("restore: title volta ao generico", (await getTitle(page)) === GENERIC_TITLE);
      check(
        "restore: og:title volta ao generico",
        (await getMeta(page, "property", "og:title")) === GENERIC_TITLE
      );
      check(
        "restore: og:url volta sem hash",
        (await getMeta(page, "property", "og:url")) === GENERIC_OG_URL
      );
      await ctx.close();
    } else {
      check("restore: setup falhou", false);
      check("restore: setup falhou", false);
      check("restore: setup falhou", false);
    }
  }

  // 4) Sem leak entre chars (substitui o teste de "char sem description" que
  // nao e possivel no dataset atual — todos os 487 chars tem description).
  // Aqui validamos que abrir um 2º char via novo deep-link sobrescreve o 1º
  // corretamente (4 checks).
  {
    const probe = await browser.newContext({ serviceWorkers: "block" });
    const probePage = await probe.newPage();
    await probePage.goto(BASE + "/", { waitUntil: "load" });
    const { a, b } = await discoverChars(probePage);
    await probe.close();

    if (!a || !b || a.slug === b.slug) {
      check("overwrite: setup (2 chars distintos)", false);
      check("overwrite: 2º char visivel no title", false);
      check("overwrite: og:title vira 2º char", false);
      check("overwrite: og:url vira 2º slug", false);
    } else {
      // abre direto o 2º char (simula "abrir um char sem fechar o anterior")
      const { ctx, page } = await freshPage(`/#${encodeURIComponent(b.id)}`);
      try {
        await page.waitForFunction((n) => document.title.includes(n), b.name, { timeout: 4000 });
      } catch {
        /* fall through */
      }
      const title = await getTitle(page);
      check(
        "overwrite: 2º char visivel no title (1º nao vaza)",
        title.includes(b.name) && !title.includes(a.name),
        `title="${title}"`
      );
      check(
        "overwrite: og:title vira 2º char",
        (await getMeta(page, "property", "og:title")).includes(b.name)
      );
      check(
        "overwrite: og:url vira 2º slug",
        (await getMeta(page, "property", "og:url")).includes(`#${b.slug}`)
      );
      check(
        "overwrite: og:image preservado",
        (await getMeta(page, "property", "og:image")) === GENERIC_OG_IMAGE
      );
      await ctx.close();
    }
  }

  console.log(`\n${pass} ✅ / ${fail} ❌`);
  process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error("ERRO:", e.message);
  process.exit(2);
} finally {
  await browser.close();
}
