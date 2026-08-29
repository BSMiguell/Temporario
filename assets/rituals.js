/* Aetheria Codex — Rituals de Invocação (Fase A) */
/* Arquitetura: RITUALS[groupKey] = fn(cardEl, modalEl, groupColor) */
/* Os rituais rodam entre o clique e a troca de conteudo do modal (hook no view-transition). */
/* Fallback: prefers-reduced-motion pula direto para o morph simples atual. */
/* Duracao maxima: 900ms; nao bloqueiam o fetch/troca de conteudo. */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  const RITUALS = {};

  /* --- Helpers --- */
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function addTempClass(el, cls) {
    if (!el) return;
    el.classList.add(cls);
  }
  function removeTempClass(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
  }
  function runAfter(ms, fn) { setTimeout(fn, ms); }

  /* Rit ual 03 — Ordens e Guerreiros: Baixar de estandarte */
  RITUALS['03_Ordens_E_Guerreiros'] = function (card, modal, color) {
    if (prefersReduced) return;
    card.classList.add('ritual-03-banner');
    modal.classList.add('ritual-03-modal');
    runAfter(700, function () {
      card.classList.remove('ritual-03-banner');
      modal.classList.remove('ritual-03-modal');
    });
  };

  /* Rit ual 07 — Gigantes: Impacto de passo */
  RITUALS['07_Gigantes'] = function (card, modal, color) {
    if (prefersReduced) return;
    card.classList.add('ritual-07-impact');
    modal.classList.add('ritual-07-modal');
    runAfter(800, function () {
      card.classList.remove('ritual-07-impact');
      modal.classList.remove('ritual-07-modal');
    });
  };

  /* Rit ual 08 — Monstros: Mandibula se abre (clip-path V) */
  RITUALS['08_Monstros'] = function (card, modal, color) {
    if (prefersReduced) return;
    card.classList.add('ritual-08-jaw');
    modal.classList.add('ritual-08-modal');
    runAfter(750, function () {
      card.classList.remove('ritual-08-jaw');
      modal.classList.remove('ritual-08-modal');
    });
  };

  /* Rit ual 14 — Demonios do Caos: Fractura instavel */
  RITUALS['14_Demonios_Do_Caos'] = function (card, modal, color) {
    if (prefersReduced) return;
    card.classList.add('ritual-14-fracture');
    modal.classList.add('ritual-14-modal');
    runAfter(850, function () {
      card.classList.remove('ritual-14-fracture');
      modal.classList.remove('ritual-14-modal');
    });
  };

  /* Rit ual 17 — Meio-Sangue: Duas metades se fundem */
  RITUALS['17_Meio_Sangue'] = function (card, modal, color) {
    if (prefersReduced) return;
    card.classList.add('ritual-17-merge');
    modal.classList.add('ritual-17-modal');
    runAfter(700, function () {
      card.classList.remove('ritual-17-merge');
      modal.classList.remove('ritual-17-modal');
    });
  };

  /* Rit ual 19 — Barbaros: Machado corta o veu */
  RITUALS['19_Barbaros'] = function (card, modal, color) {
    if (prefersReduced) return;
    card.classList.add('ritual-19-axe');
    modal.classList.add('ritual-19-modal');
    runAfter(800, function () {
      card.classList.remove('ritual-19-axe');
      modal.classList.remove('ritual-19-modal');
    });
  };

  /* Ajuste pós-print real: reaproveita a marca d'água existente (ícone da raça) como parte do ritual */
  function animateWatermark(modal, color) {
    var wm = document.querySelector('.hero-watermark') || document.querySelector('.lore-watermark');
    if (!wm) return;
    wm.classList.add('ritual-mark-active');
    runAfter(700, function () { wm.classList.remove('ritual-mark-active'); });
  }

  /* Fallback generico para grupos ainda sem ritual implementado */
  function ritualFallback(card, modal, color) {
    // Nenhuma classe adicionada; apenas retorna imediatamente.
  }

  /* Expor globalmente */
  window.AETHERIA_RITUALS = RITUALS;
  window.runRitual = function (groupKey, cardEl, modalEl, groupColor) {
    var fn = RITUALS[groupKey] || ritualFallback;
    try {
      fn(cardEl, modalEl, groupColor);
    } catch (e) {
      // Silenciosamente ignora erros de ritual; nunca quebra o fluxo principal.
    }
  };
})();
