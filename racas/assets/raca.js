/* ============================================================
   AETHERIA CODEX — PÁGINAS DE RAÇA · engine (vanilla, 0 deps)
   Lê o payload embutido em <script id="race-data"> e monta:
   · hero rotativo (autoplay c/ barra de progresso, coreografia
     de troca via WAAPI, reveal por caractere, tilt 3D + glare,
     partículas em canvas, deep-link #id, swipe e teclado)
   · lore da raça, acervo completo, navegação entre as 21 raças
   · ficha lateral (sheet) com todos os atributos
   · tema claro/escuro persistido (localStorage.racasTheme)
   ============================================================ */
(() => {
  "use strict";

  // ---------- payload embutido ----------
  const dataEl = document.getElementById("race-data");
  let DATA = null;
  try {
    DATA = JSON.parse(dataEl ? dataEl.textContent : "null");
  } catch (err) {
    console.error("[racas] payload race-data inválido:", err);
  }
  if (!DATA || !Array.isArray(DATA.members)) return;

  const RACE = DATA.race;
  const MEMBERS = DATA.members;
  const AUTOPLAY_MS = 7000;

  // ---------- utilidades ----------
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // texto preto ou branco conforme luminância do fundo (mesma regra do index)
  function bestInk(hex) {
    try {
      const n = parseInt(hex.slice(1), 16);
      const lin = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const L =
        0.2126 * lin((n >> 16) & 255) +
        0.7152 * lin((n >> 8) & 255) +
        0.0722 * lin(n & 255);
      return L > 0.4 ? "#171310" : "#ffffff";
    } catch (err) {
      return "#ffffff";
    }
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // "Aatrox-V-1, o Tirano de Sangue" → nome + epíteto
  function splitTitle(title) {
    const s = String(title || "");
    const comma = s.indexOf(",");
    if (comma === -1) return { name: s, epithet: "" };
    return { name: s.slice(0, comma).trim(), epithet: s.slice(comma + 1).trim() };
  }

  // ---------- identidade da raça nas vars do :root ----------
  root.style.setProperty("--group-color", RACE.color);
  root.style.setProperty("--group-ink", bestInk(RACE.color));
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", RACE.color);

  // ---------- tema claro/escuro ----------
  const THEME_KEY = "racasTheme";
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (err) {
      /* sem storage: segue sem persistir */
    }
  }
  const themeBtn = $("themeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  // ---------- estado do carrossel ----------
  let idx = 0;
  let dirNext = 1; // direção da última navegação (+1 avança, −1 volta)
  const pauseReasons = new Set();
  const isPaused = () => pauseReasons.size > 0;
  let elapsed = 0;
  let lastTs = null;
  let tickRaf = null;
  let currentImg = null;

  function pause(reason) { pauseReasons.add(reason); }
  function resume(reason) { pauseReasons.delete(reason); }

  // ---------- DOM ----------
  const hero = $("hero");
  const fxCanvas = $("fxCanvas");
  const kickerIdx = $("kickerIdx");
  const heroName = $("heroName");
  const heroEpithet = $("heroEpithet");
  const heroDesc = $("heroDesc");
  const heroChips = $("heroChips");
  const stageFrame = $("stageFrame");
  // observers com referência forte — observer sem referência viva pode ser
  // coletado pelo GC e a feature morre silenciosamente após o boot
  let heroIO = null;
  let particlesIO = null;
  const stageCaption = $("stageCaption");
  const dotsWrap = $("dots");
  const timerBar = $("timerBar");
  const sheet = $("sheet");

  const ATTR_LABELS = [
    ["race", "Raça"],
    ["physical", "Físico & Postura"],
    ["faceAndHair", "Rosto & Cabelo"],
    ["outfit", "Vestuário"],
    ["palette", "Paleta de Cores"],
    ["equipment", "Acessórios & Equipamento"],
  ];

  // ---------- mídia de um membro (imagem ou placeholder) ----------
  function mediaHTML(m, lazy) {
    if (m.image) {
      return `<img src="${esc(m.image)}" alt="${esc(m.title)}" ${lazy ? 'loading="lazy" decoding="async"' : 'decoding="async"'} draggable="false">`;
    }
    const initial = esc((splitTitle(m.title).name || "?").charAt(0).toUpperCase());
    return `<div class="member-ph"><span class="ph-icon">${esc(RACE.icon)}</span><span class="ph-initial">${initial}</span><span class="ph-label">Sem arte</span></div>`;
  }

  function hasArt(m) {
    return Boolean(m.image);
  }

  // ---------- reveal por caractere no nome ----------
  function setNameChars(text) {
    const words = String(text || "").split(" ");
    let d = 0;
    const step = Math.max(0.018, Math.min(0.055, 0.5 / Math.max(text.length, 1)));
    heroName.innerHTML = words
      .map(
        (w) =>
          `<span class="w">${[...w]
            .map((ch) => `<span class="char" style="--d:${(d++ * step).toFixed(3)}s">${esc(ch)}</span>`)
            .join("")}</span>`,
      )
      .join(" ");
    heroName.classList.remove("is-in");
    void heroName.offsetWidth; // reinicia a transição dos chars
    heroName.classList.add("is-in");
  }

  // ---------- coreografia de troca (WAAPI) ----------
  const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  const EASE_IN = "cubic-bezier(0.55, 0.06, 0.68, 0.19)";

  function animateSwap(oldNode, newNode, direction) {
    // 1º render não tem nó antigo — só anima a entrada (ou troca seca)
    if (
      !oldNode ||
      reducedMotion ||
      typeof oldNode.animate !== "function"
    ) {
      if (oldNode && oldNode.remove) oldNode.remove();
      return;
    }
    const d = direction >= 0 ? 1 : -1;
    oldNode.animate(
      [
        { opacity: 1, transform: "translateX(0) rotateY(0deg) scale(1)" },
        { opacity: 0, transform: `translateX(${d * -52}px) rotateY(${d * 9}deg) scale(0.965)` },
      ],
      { duration: 360, easing: EASE_IN, fill: "forwards" },
    ).finished.then(() => oldNode.remove()).catch(() => oldNode.remove());

    newNode.animate(
      [
        { opacity: 0, transform: `translateX(${d * 58}px) rotateY(${d * -8}deg) scale(0.98)` },
        { opacity: 1, transform: "translateX(0) rotateY(0deg) scale(1)" },
      ],
      { duration: 560, delay: 110, easing: EASE_OUT, fill: "backwards" },
    );
  }

  function animateCopy(direction) {
    if (reducedMotion || !heroName.animate) return;
    const d = direction >= 0 ? 1 : -1;
    const layers = [
      $(".hero-kicker"),
      heroName,
      heroEpithet,
      heroDesc,
      heroChips,
      $(".hero-actions"),
    ].filter(Boolean);
    layers.forEach((el, i) => {
      // saída segura o estado final com fill:forwards — precisa ser
      // cancelada quando a entrada terminar, senão ela volta a valer
      // (coluna de texto ficaria invisível/deslocada para sempre)
      const out = el.animate(
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: `translateX(${d * -26}px)` },
        ],
        { duration: 240, easing: EASE_IN, fill: "forwards" },
      );
      const inn = el.animate(
        [
          { opacity: 0, transform: `translateX(${d * 30}px)` },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 480, delay: 150 + i * 55, easing: EASE_OUT, fill: "backwards" },
      );
      inn.finished.then(() => out.cancel()).catch(() => out.cancel());
    });
  }

  // ---------- render do membro no palco ----------
  let glare = null;

  function renderStage(m, direction) {
    const old = stageFrame.querySelector(".member-media");

    const node = document.createElement("div");
    node.className = "member-media";
    node.innerHTML = mediaHTML(m, false);

    // glare fica por cima; insere a mídia antes dele
    if (!glare) glare = stageFrame.querySelector(".stage-glare");
    if (glare) stageFrame.insertBefore(node, glare);
    else stageFrame.appendChild(node);

    animateSwap(old, node, direction);

    currentImg = node.querySelector("img");
    if (currentImg && !reducedMotion) {
      currentImg.addEventListener("load", () => {
        currentImg.classList.add("is-kb");
      });
      currentImg.addEventListener("error", () => {
        // arte sumida/quebrada → placeholder no lugar
        node.innerHTML = mediaHTML({ ...m, image: null }, false);
        currentImg = null;
        resetTilt();
      });
    } else {
      resetTilt();
    }
    if (hasArt(m)) preloadAround();
  }

  function preloadAround() {
    [idx + 1, idx - 1].forEach((i) => {
      const m = MEMBERS[(i + MEMBERS.length) % MEMBERS.length];
      if (m && m.image) {
        const im = new Image();
        im.src = m.image;
      }
    });
  }

  // ---------- goTo / next / prev ----------
  const pad2 = (n) => String(n).padStart(2, "0");

  function goTo(i, direction) {
    const n = MEMBERS.length;
    idx = ((i % n) + n) % n;
    dirNext = direction >= 0 ? 1 : -1;
    elapsed = 0;
    if (lastTs !== null) lastTs = performance.now();

    const m = MEMBERS[idx];
    const t = splitTitle(m.title);

    kickerIdx.textContent = `${pad2(idx + 1)} / ${pad2(n)}`;
    setNameChars(t.name);
    heroEpithet.textContent = t.epithet ? `, ${t.epithet}` : "";
    heroDesc.textContent = m.description || "";
    heroChips.innerHTML = ATTR_LABELS.filter(([k]) => m.attributes && m.attributes[k])
      .slice(0, 2)
      .map(([k, label]) => `<li class="chip" title="${esc(m.attributes[k])}"><strong>${label}:</strong>&nbsp;${esc(m.attributes[k])}</li>`)
      .join("");
    stageCaption.textContent = m.title;

    renderStage(m, dirNext);
    animateCopy(dirNext);

    [...dotsWrap.children].forEach((dot, di) => {
      dot.classList.toggle("is-active", di === idx);
      if (di === idx) {
        dot.style.setProperty("--p", 0);
        dot.scrollIntoView({ inline: "center", block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
      } else {
        dot.style.removeProperty("--p");
      }
    });

    // deep-link limpo (sem poluir o histórico)
    try {
      history.replaceState(null, "", `#${encodeURIComponent(m.id)}`);
    } catch (err) {
      /* file:// em alguns browsers nega; é cosmético */
    }
    openSheetFor(m, true); // se a ficha estiver aberta, acompanha o membro
  }

  const next = () => goTo(idx + 1, 1);
  const prev = () => goTo(idx - 1, -1);

  // ---------- autoplay (rAF timeline com barra de progresso) ----------
  function tick(ts) {
    tickRaf = requestAnimationFrame(tick);
    if (lastTs === null) {
      lastTs = ts;
      return;
    }
    const dt = ts - lastTs;
    lastTs = ts;
    if (isPaused()) return;
    elapsed += dt;
    const p = Math.min(elapsed / AUTOPLAY_MS, 1);
    timerBar.style.setProperty("--p", p.toFixed(4));
    const activeDot = dotsWrap.children[idx];
    if (activeDot) activeDot.style.setProperty("--p", p.toFixed(4));
    if (elapsed >= AUTOPLAY_MS) next();
  }

  // pausa automática: hover no palco / foco no hero, aba oculta,
  // herói fora da tela, ficha aberta.
  // O hover fica só no PALCO (não no .hero inteiro): como o herói ocupa
  // ~100vh, mouse parado sobre o texto congelaria a rotação para sempre.
  if (hero) {
    const hoverEl = stageFrame || hero;
    hoverEl.addEventListener("mouseenter", () => pause("hover"));
    hoverEl.addEventListener("mouseleave", () => resume("hover"));
    hero.addEventListener("focusin", () => pause("focus"));
    hero.addEventListener("focusout", () => resume("focus"));
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause("tab");
    else resume("tab");
  });
  if ("IntersectionObserver" in window && hero) {
    // referência forte no escopo do IIFE (handlers mantêm o escopo vivo):
    // observer só-local pode virar lixo do GC e a pausa offscreen morre
    heroIO = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) resume("offscreen");
        else pause("offscreen");
      },
      { threshold: 0.25 },
    );
    heroIO.observe(hero);
  }

  // ---------- controles ----------
  $("nextBtn").addEventListener("click", next);
  $("prevBtn").addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePicker();
      closeSheet();
      return;
    }
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  // swipe (pointer events cobrem toque e mouse)
  let swipeX = null;
  let swipeY = null;
  if (hero) {
    hero.addEventListener("pointerdown", (e) => {
      swipeX = e.clientX;
      swipeY = e.clientY;
    });
    hero.addEventListener("pointerup", (e) => {
      if (swipeX === null) return;
      const dx = e.clientX - swipeX;
      const dy = e.clientY - swipeY;
      swipeX = swipeY = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) next();
        else prev();
      }
    });
  }

  // ---------- tilt 3D na arte (padrão do modal do index, adaptado) ----------
  const TILT_MAX = 6;
  const TILT_LERP = 0.12;
  let tx = 0, ty = 0, cx = 0, cy = 0, tiltRaf = null;

  function tiltFrame() {
    cx += (tx - cx) * TILT_LERP;
    cy += (ty - cy) * TILT_LERP;
    stageFrame.style.setProperty("--ry", `${(cx * TILT_MAX).toFixed(2)}deg`);
    stageFrame.style.setProperty("--rx", `${(-cy * TILT_MAX).toFixed(2)}deg`);
    if (glare) {
      glare.style.setProperty("--gx", `${(50 + cx * 32).toFixed(1)}%`);
      glare.style.setProperty("--gy", `${(50 + cy * 32).toFixed(1)}%`);
    }
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
      tiltRaf = requestAnimationFrame(tiltFrame);
    } else {
      tiltRaf = null;
    }
  }
  function startTilt() {
    if (tiltRaf === null) tiltRaf = requestAnimationFrame(tiltFrame);
  }
  function resetTilt() {
    tx = ty = cx = cy = 0;
    if (tiltRaf !== null) {
      cancelAnimationFrame(tiltRaf);
      tiltRaf = null;
    }
    stageFrame.classList.remove("is-tilting");
    ["--rx", "--ry"].forEach((v) => stageFrame.style.removeProperty(v));
    if (glare) ["--gx", "--gy"].forEach((v) => glare.style.removeProperty(v));
  }

  if (finePointer && !reducedMotion && stageFrame) {
    stageFrame.addEventListener("mousemove", (e) => {
      if (!currentImg) return; // placeholder não inclina
      const r = stageFrame.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      stageFrame.classList.add("is-tilting");
      startTilt();
    });
    stageFrame.addEventListener("mouseleave", () => {
      tx = 0;
      ty = 0;
      stageFrame.classList.remove("is-tilting");
      startTilt();
    });
  }

  // ---------- partículas (canvas, brasas/motes na cor da raça) ----------
  function initParticles() {
    if (!fxCanvas || reducedMotion || fxCanvas.getContext === undefined) return;
    const ctx = fxCanvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, parts = [], running = true, pRaf = null;

    // sprite pré-renderizado (radial suave) tingido com a cor da raça
    const sprite = document.createElement("canvas");
    const S = 64;
    sprite.width = sprite.height = S;
    const sctx = sprite.getContext("2d");
    const [r, g, b] = hexToRgb(RACE.color);
    const grad = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.25, `rgba(${r},${g},${b},0.85)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, S, S);

    function resize() {
      const rect = hero.getBoundingClientRect();
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      fxCanvas.width = W * dpr;
      fxCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(70, Math.max(36, (W * H) / 34000)));
      parts = Array.from({ length: target }, () => spawn(true));
    }
    function spawn(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 10,
        r: 0.8 + Math.random() * 2.4,
        vy: 6 + Math.random() * 16, // sobe (px/s)
        drift: Math.random() * Math.PI * 2,
        dspeed: 0.4 + Math.random() * 1.2,
        tw: Math.random() * Math.PI * 2,
        twspeed: 0.6 + Math.random() * 1.8,
        white: Math.random() < 0.18, // algumas partículas quase brancas
      };
    }
    let lastP = performance.now();
    function frame(now) {
      if (!running) { pRaf = null; return; }
      pRaf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastP) / 1000, 0.06);
      lastP = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.y -= p.vy * dt;
        p.drift += p.dspeed * dt;
        p.tw += p.twspeed * dt;
        p.x += Math.sin(p.drift) * 10 * dt;
        if (p.y < -12) Object.assign(p, spawn(false));
        const alpha = 0.28 + Math.sin(p.tw) * 0.22;
        const size = p.r * (p.white ? 5 : 6.5);
        ctx.globalAlpha = Math.max(alpha, 0.04);
        if (p.white) ctx.globalAlpha *= 0.75;
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    resize();
    addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        lastP = performance.now();
        pRaf = requestAnimationFrame(frame);
      }
    });
    // economiza bateria: para quando o herói sai da tela
    if ("IntersectionObserver" in window) {
      particlesIO = new IntersectionObserver(([entry]) => {
        const wantRun = entry.isIntersecting && !document.hidden;
        if (wantRun && !running) {
          running = true;
          lastP = performance.now();
          pRaf = requestAnimationFrame(frame);
        } else if (!wantRun) {
          running = false;
        }
      }, { threshold: 0.05 });
      particlesIO.observe(hero);
    }
    pRaf = requestAnimationFrame(frame);
  }

  // ---------- dots (indicadores-barrinha numerados) ----------
  function buildDots() {
    dotsWrap.innerHTML = MEMBERS.map((m, i) => {
      const t = splitTitle(m.title);
      return `<button class="dot" role="tab" title="${esc(i + 1)}. ${esc(t.name)}" aria-label="Ir para ${esc(t.name)}" data-i="${i}"></button>`;
    }).join("");
    dotsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".dot");
      if (!btn) return;
      const i = Number(btn.dataset.i);
      goTo(i, i > idx ? 1 : -1);
    });
  }

  // ---------- lore ----------
  function fillLore() {
    $("loreCount").textContent = RACE.count;
    $("loreDesc").textContent = RACE.lore || "";
    const chips = [];
    if (RACE.tipo) chips.push(`<li class="chip"><strong>Tipo:</strong>&nbsp;${esc(RACE.tipo)}</li>`);
    (RACE.regioes || []).forEach((reg) => {
      chips.push(`<li class="chip"><strong>Região:</strong>&nbsp;${esc(reg)}</li>`);
    });
    $("loreChips").innerHTML = chips.join("");
    $("rosterCount").textContent = MEMBERS.length;
    $("galleryLink").href = `../index.html#${encodeURIComponent(RACE.folder)}`;
  }

  // ---------- acervo ----------
  function buildRoster() {
    const grid = $("rosterGrid");
    grid.innerHTML = MEMBERS.map((m, i) => {
      const t = splitTitle(m.title);
      return `<li><button class="member-card" data-i="${i}" style="--rd:${(i % 12) * 0.045}s" aria-label="Destacar ${esc(t.name)} no banner">
        <span class="card-media">${mediaHTML(m, true)}</span>
        <span class="card-num">#${pad2(m.number || i + 1)}</span>
        <span class="card-info">
          <span class="card-name">${esc(t.name)}</span>
          ${t.epithet ? `<span class="card-epithet">${esc(t.epithet)}</span>` : ""}
        </span>
      </button></li>`;
    }).join("");

    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".member-card");
      if (!card) return;
      const i = Number(card.dataset.i);
      goTo(i, i > idx ? 1 : -1);
      scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  // ---------- navegação entre raças ----------
  function fillRaceNav() {
    const nb = DATA.neighbors || {};
    const mk = (a, o) => {
      if (!o) { a.hidden = true; return; }
      a.href = o.href;
      a.style.setProperty("--rc", o.color);
      a.querySelector(".rn-name").textContent = o.label;
    };
    mk($("racePrev"), nb.prev);
    mk($("raceNext"), nb.next);

    const index = $("raceIndex");
    index.innerHTML = (DATA.allRaces || [])
      .map(
        (r) =>
          `<a class="rn-chip${r.href.indexOf(encodeURIComponent(RACE.folder)) !== -1 || r.label === RACE.label ? " is-current" : ""}"
              href="${esc(r.href)}" style="--rc:${esc(r.color)}" title="${esc(r.label)} (${r.count})">${esc(r.icon)}</a>`,
      )
      .join("");
  }

  // ---------- seletor de raças (dropdown) ----------
  const pickerBtn = $("pickerBtn");
  const pickerMenu = $("pickerMenu");
  function closePicker() {
    if (!pickerMenu) return;
    pickerMenu.classList.remove("is-open");
    pickerMenu.setAttribute("aria-expanded", "false");
    pickerBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (!pickerMenu.classList.contains("is-open")) pickerMenu.hidden = true;
    }, 220);
  }
  function buildPicker() {
    if (!pickerMenu) return;
    pickerMenu.innerHTML = (DATA.allRaces || [])
      .map(
        (r) =>
          `<a class="picker-item${r.label === RACE.label ? " is-current" : ""}" role="option"
              href="${esc(r.href)}" style="--pi-color:${esc(r.color)}">
             <span class="pi-dot"></span><span>${esc(r.icon)} ${esc(r.label)}</span>
             <span class="pi-count">${Number(r.count) || ""}</span></a>`,
      )
      .join("");
    pickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = pickerMenu.hidden;
      if (opening) {
        pickerMenu.hidden = false;
        requestAnimationFrame(() => {
          pickerMenu.classList.add("is-open");
          pickerMenu.setAttribute("aria-expanded", "true");
          pickerBtn.setAttribute("aria-expanded", "true");
        });
      } else {
        closePicker();
      }
    });
    document.addEventListener("click", (e) => {
      if (!pickerMenu.contains(e.target) && e.target !== pickerBtn) closePicker();
    });
  }

  // ---------- ficha lateral (sheet) ----------
  let sheetOpen = false;
  let sheetReturnFocus = null;

  function openSheetFor(m, silent) {
    if (!sheetOpen || !m) return;
    const t = splitTitle(m.title);
    $("sheetName").textContent = t.name;
    $("sheetEpithet").textContent = t.epithet ? `, ${t.epithet}` : "";
    $("sheetDesc").textContent = m.description || "";
    $("sheetFields").innerHTML = ATTR_LABELS.filter(([k]) => m.attributes && m.attributes[k])
      .map(
        ([k, label]) =>
          `<div class="sf-row"><p class="sf-label">${label}</p><p class="sf-value">${esc(m.attributes[k])}</p></div>`,
      )
      .join("");
    if (!silent) {
      // abre acompanhando o membro atual
      $("sheetName").textContent = t.name;
    }
  }

  function openSheet() {
    if (!sheet || sheetOpen) return;
    sheetOpen = true; // antes de preencher: openSheetFor exige aberto
    openSheetFor(MEMBERS[idx], false);
    pause("sheet");
    sheetReturnFocus = document.activeElement;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add("is-open"));
    $("sheetClose").focus();
  }
  function closeSheet() {
    if (!sheet || !sheetOpen) return;
    sheetOpen = false;
    resume("sheet");
    sheet.classList.remove("is-open");
    setTimeout(() => {
      sheet.hidden = true;
    }, 450);
    if (sheetReturnFocus && sheetReturnFocus.focus) sheetReturnFocus.focus();
  }

  $("sheetBtn").addEventListener("click", openSheet);
  $("sheetClose").addEventListener("click", closeSheet);
  $("sheetBg").addEventListener("click", closeSheet);

  // ---------- reveal ao rolar ----------
  // referência forte no escopo do módulo: um observer só alcançável por
  // variável local pode ser coletado pelo GC depois do boot — e as reveals
  // morrem silenciosamente (lote inicial entrega, depois nunca mais)
  let revealIO = null;

  function initReveals() {
    const els = document.querySelectorAll(".reveal, .member-card");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }
    // progressive enhancement: esconder SÓ aqui, imediatamente antes de
    // observar (e apenas porque IO existe) — sem JS ou sem IO, o conteúdo
    // nunca deixa de estar visível; reveal é enhancement, não requisito.
    els.forEach((el) => el.classList.add("pre-reveal"));
    revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            entry.target.classList.remove("pre-reveal");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => revealIO.observe(el));

    // cinto de segurança contra o IO morrer silenciosamente (modo de falha
    // observado em 25/08/2026: lote inicial isi=false e nunca mais dispara):
    // sweep periódico revela qualquer .pre-reveal já na viewport usando a
    // MESMA classe .in-view — visualmente idêntico ao caminho do IO. Para
    // sozinho quando não sobrar nada pendente.
    const sweepTimer = setInterval(() => {
      let pendente = false;
      document.querySelectorAll(".pre-reveal").forEach((el) => {
        const r = el.getBoundingClientRect();
        const visivel =
          r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        if (visivel) {
          el.classList.add("in-view");
          el.classList.remove("pre-reveal");
          revealIO.unobserve(el);
        } else {
          pendente = true;
        }
      });
      if (!pendente) clearInterval(sweepTimer);
    }, 900);
  }

  // ---------- deep-link inicial (#id-do-personagem) ----------
  function initialIndexFromHash() {
    const h = decodeURIComponent((location.hash || "").slice(1));
    if (!h) return 0;
    const found = MEMBERS.findIndex((m) => m.id === h || m.name === h);
    return found === -1 ? 0 : found;
  }

  // hash mudou sem recarregar (voltar/avançar, link âncora na mesma página)
  addEventListener("hashchange", () => {
    if (!location.hash || location.hash === "#") return;
    const i = initialIndexFromHash();
    if (MEMBERS[i] && i !== idx) goTo(i, i > idx ? 1 : -1);
  });

  // ---------- boot ----------
  function boot() {
    // cabeçalho: ícone/rótulo da raça
    document.querySelector(".head-race .head-icon").textContent = RACE.icon;
    document.querySelector(".head-race .head-label").textContent = RACE.label;
    $("kickerRace").textContent = RACE.label;
    $("heroWatermark").textContent = RACE.icon;
    const lw = document.querySelector(".lore-watermark");
    if (lw) lw.textContent = RACE.icon;

    fillLore();
    fillRaceNav();
    buildPicker();
    buildDots();
    buildRoster();
    initReveals();

    goTo(initialIndexFromHash(), 1);
    initParticles();
    requestAnimationFrame((ts) => {
      lastTs = ts;
      tickRaf = requestAnimationFrame(tick);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
