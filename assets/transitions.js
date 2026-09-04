/* Aetheria Codex — Transições de Página (SEPARADO de rituals.js) */
/* APENAS 04_Onis (vídeo overlay) e 05_Demonios (portão do inferno) */
/* NÃO contém os rituais do modal (03, 07, 08, 14, 17, 19) — esses estão em assets/rituals.js */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  const RITUALS = {};
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function runAfter(ms, fn) { setTimeout(fn, ms); }

  /* 04 — Onis: vídeo overlay */
  RITUALS['04_Onis'] = function (card, modal, color) {
    if (prefersReduced) return;
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
    if (document.getElementById('trans-04-video')) return;
    var stage = document.createElement('div');
    stage.id = 'trans-04-video';
    stage.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0a0206;display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none;';
    var video = document.createElement('video');
    var vidPath = (window.location.pathname.indexOf('racas/') !== -1) ? '../assets/videos/onis-transition.mp4' : 'assets/videos/onis-transition.mp4';
    video.src = vidPath;
    video.style.cssText = 'width:100vw;height:100vh;object-fit:cover;opacity:0.92;';
    video.autoplay = true; video.muted = false; video.playsInline = true;
    video.setAttribute('playsinline', ''); sessionStorage.setItem('onisVideoPlayed', '1');
    video.setAttribute('webkit-playsinline', '');
    var bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, #3d0f0f 0%, #0a0206 70%);z-index:-1;';
    stage.appendChild(bg); stage.appendChild(video); document.body.appendChild(stage);
    video.addEventListener('ended', function () { if (stage.parentNode) stage.parentNode.removeChild(stage); });
    setTimeout(function () { if (stage.parentNode) stage.parentNode.removeChild(stage); }, 4000);
  };

  /* 05 — Demônios: vídeo overlay (demonios-transition.mp4) */
  RITUALS['05_Demonios'] = function (card, modal, color) {
    if (prefersReduced) return;
    if (sessionStorage.getItem('ritual_05_played') === '1') return;
    if (document.getElementById('trans-05-video')) return;
    var stage = document.createElement('div');
    stage.id = 'trans-05-video';
    stage.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0a0206;display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none;';
    var video = document.createElement('video');
    var vidPath = (window.location.pathname.indexOf('racas/') !== -1) ? '../assets/videos/demonios-transition.mp4' : 'assets/videos/demonios-transition.mp4';
    video.src = vidPath;
    video.style.cssText = 'width:100vw;height:100vh;object-fit:cover;opacity:0.92;';
    video.autoplay = true; video.muted = false; video.playsInline = true;
    video.setAttribute('playsinline', ''); sessionStorage.setItem('ritual_05_played', '1');
    video.setAttribute('webkit-playsinline', '');
    var bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, #5a0d18 0%, #0a0206 70%);z-index:-1;';
    stage.appendChild(bg); stage.appendChild(video); document.body.appendChild(stage);
    video.addEventListener('ended', function () { if (stage.parentNode) stage.parentNode.removeChild(stage); });
    setTimeout(function () { if (stage.parentNode) stage.parentNode.removeChild(stage); }, 4000);
  };

  function ritualFallback(card, modal, color) {}
  window.AETHERIA_RITUALS = RITUALS;
  window.runRitual = function (groupKey, cardEl, modalEl, groupColor) {
    var fn = RITUALS[groupKey] || ritualFallback;
    try { fn(cardEl, modalEl, groupColor); } catch (e) {}
  };
})();
