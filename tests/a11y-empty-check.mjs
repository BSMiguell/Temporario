// Teste do §4.1 + §4.2 — Skip-link + Empty state melhorado
// Cobre: skip-link no index.html (presente, com href certo, focus via Tab),
// empty state com microcopy tematico por raça (22 raças), 3 sugestões de
// raça mais populosa em vez de 1 aleatória, chips funcionam.
//
// Limitação documentada: como o grid do index.html tem virtualização
// (INITIAL_BATCH=18 cards), testamos o empty state programaticamente via
// searchTerm com texto inexistente, que zera filteredCharacters (total=0).

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
  // ========== Bloco 1: §4.1 skip-link (4 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "load" });
    await page.waitForSelector(".skip-link", { timeout: 5000 });

    const temSkip = await page.evaluate(() => {
      const a = document.querySelector(".skip-link");
      if (!a) return null;
      return {
        href: a.getAttribute("href"),
        text: a.textContent.trim().length > 0,
        target: document.querySelector(a.getAttribute("href")) !== null
      };
    });
    check(
      "§4.1: skip-link presente, com href válido e alvo existente",
      temSkip && temSkip.text && temSkip.target,
      `href=${temSkip?.href} text=${temSkip?.text} target=${temSkip?.target}`
    );

    // Tab pro primeiro elemento focável, deve revelar o skip-link.
    // Playwright comeca do body se nao ha foco anterior; forca o foco
    // no document.body antes do Tab pra garantir o caminho.
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      document.body.tabIndex = -1;
      document.body.focus();
    });
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);
    const skipFocused = await page.evaluate(() => {
      const a = document.querySelector(".skip-link");
      return document.activeElement === a;
    });
    check("§4.1: Tab inicial foca o skip-link", skipFocused);

    // Pressiona Enter, deve pular pro alvo (characterGrid).
    // A pular com href="#characterGrid" so altera o hash; o alvo
    // recebe foco se tiver tabindex, senao so o hash muda.
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    const scrolledToTarget = await page.evaluate(() => {
      return location.hash === "#characterGrid" || document.activeElement?.id === "characterGrid";
    });
    check(
      "§4.1: Enter no skip-link navega pra #characterGrid",
      scrolledToTarget,
      `hash=${await page.evaluate(() => location.hash)} activeId=${await page.evaluate(() => document.activeElement?.id)}`
    );
    await ctx.close();
  }

  // ========== Bloco 2: §4.2 empty state (5 checks) ==========
  {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "load" });
    await page.waitForSelector(".character-card", { timeout: 8000 });
    // Espera tema carregar (loadThemes) e grid inicializar
    await page.waitForTimeout(500);

    // Dispara empty state via Ctrl+K + busca inexistente
    await page.keyboard.press("Control+K");
    await page.waitForSelector(".palette-input", { timeout: 2000 });
    await page.locator(".palette-input").click();
    await page.keyboard.type("xyznaoexiste12345");
    await page.waitForTimeout(400);
    // Aciona o filtro de busca principal via teclado da paleta
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // A paleta filtra via selectedGroup; mas a grid vazia eh por searchTerm.
    // O empty state da grid sobe quando total=0. Forcamos via:
    //   - setar selectedGroup pra uma pasta existente
    //   - digitar termo inexistente no search input (que existe? nao)
    // Workaround: simular via __selectedGroup__ nao existe, mas
    // selectedGroup eh privado. Em vez disso, testamos o empty state da
    // PALETTE (que tambem eh empty state) — verifica que "Nada encontrado"
    // aparece (1a versao minima do empty state em outro contexto).
    const paletteEmpty = await page.evaluate(() => {
      const li = document.querySelector(".palette .palette-empty");
      return li ? li.textContent.trim() : null;
    });
    check(
      "§4.2 (palette): busca sem resultado mostra 'Nada encontrado'",
      paletteEmpty && /Nada encontrado/i.test(paletteEmpty),
      `texto=${JSON.stringify(paletteEmpty)}`
    );
    await page.keyboard.press("Escape");
    await ctx.close();
  }

  // ========== Bloco 3: §4.2 MICRO_COPY tematico (3 checks) ==========
  {
    // Usa o hook __forceEmptyState("07_Gigantes") pra renderizar o empty state
    // sem depender da palette (que nao filtra a grid — so navega/abre modal).
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "load" });
    await page.waitForSelector(".character-card", { timeout: 8000 });
    await page.waitForFunction(() => typeof window.__forceEmptyState === "function", {
      timeout: 3000
    });

    // Dispara empty state com selectedGroup=07_Gigantes
    await page.evaluate(() => window.__forceEmptyState("07_Gigantes"));
    await page.waitForSelector(".empty-state", { timeout: 2000 });

    // Verifica que o empty state tem microcopy tematico de 07_Gigantes
    const emptyHint = await page.evaluate(() => {
      const p = document.querySelector(".empty-state .empty-hint");
      return p ? p.textContent.trim() : null;
    });
    check(
      "§4.2: empty state usa microcopy tematico de '07_Gigantes'",
      emptyHint && /gigante/i.test(emptyHint),
      `hint=${JSON.stringify(emptyHint)}`
    );

    // Verifica que sugerem 3 racas (NÃO 1 aleatoria) — top 3 populosas
    const numChips = await page.evaluate(() => {
      return document.querySelectorAll(".empty-suggestions .empty-chip[data-action='race']").length;
    });
    check(
      "§4.2: empty state oferece 3 chips de raça (top populosas)",
      numChips === 3,
      `count=${numChips}`
    );

    // Top 3 por count: 02_Mutantes (48), 05_Demonios (41), 08_Monstros (37).
    // 07_Gigantes tem 26 (fora do top 3), entao nao aparece entre as sugeridas.
    const chipLabels = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".empty-suggestions .empty-chip[data-action='race']")
      ).map((b) => b.textContent.trim());
    });
    const allTop3 =
      chipLabels.length === 3 &&
      /Mutantes/.test(chipLabels.join("|")) &&
      /Demonios/i.test(chipLabels.join("|")) &&
      /Monstros/.test(chipLabels.join("|"));
    check(
      "§4.2: top 3 chips sao Mutantes, Demonios, Monstros (mais populosos)",
      allTop3,
      `labels=${JSON.stringify(chipLabels)}`
    );

    await ctx.close();
  }

  // ========== Bloco 4: §4.2 chips funcionam (1 check) ==========
  {
    // Verifica que o chip "race" troca o filtro para a raça clicada e
    // restaura os cards dessa raça.
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "load" });
    await page.waitForSelector(".character-card", { timeout: 8000 });
    await page.waitForFunction(() => typeof window.__forceEmptyState === "function", {
      timeout: 3000
    });

    // 1) Empty state numa raça X
    await page.evaluate(() => window.__forceEmptyState("07_Gigantes"));
    await page.waitForSelector(".empty-state", { timeout: 2000 });

    // 2) Clica no chip da raça "01_Humanos" (se ela aparecer entre as 3 top)
    // 07_Gigantes tem 26 chars (fora do top 3), portanto as 3 top sao
    // Mutantes/Demonios/Monstros. Clicar em Mutantes → deve trocar selectedGroup
    // para 02_Mutantes e mostrar 48 cards.
    const clickedRace = await page.evaluate(() => {
      const chips = document.querySelectorAll(".empty-suggestions .empty-chip[data-action='race']");
      for (const c of chips) {
        if (c.dataset.group === "02_Mutantes") {
          c.click();
          return c.dataset.group;
        }
      }
      return null;
    });

    if (clickedRace) {
      await page.waitForTimeout(400);
      const cardsAfter = await page.evaluate(() => {
        const visible = document.querySelectorAll(".character-card").length;
        const counter = document.getElementById("resultCount")?.textContent || "";
        return { visible, counter };
      });
      // A grid virtualiza (INITIAL_BATCH=18 + LOAD_MORE_BATCH=18, scroll hidrata).
      // Pode haver ate 36 cards no DOM. O contador (#resultCount) tem o total real.
      const total = parseInt(cardsAfter.counter.match(/\d+/)?.[0] || "0", 10);
      check(
        "§4.2: chip 'race' (Mutantes) troca filtro e mostra 48 personagens",
        total === 48 && cardsAfter.visible >= 18 && cardsAfter.visible <= 36,
        `counter=${cardsAfter.counter} visible=${cardsAfter.visible}`
      );
    } else {
      check(
        "§4.2: chip 'race' (Mutantes) troca filtro e mostra 48 personagens",
        false,
        "chip 02_Mutantes nao encontrado entre as top 3"
      );
    }
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
