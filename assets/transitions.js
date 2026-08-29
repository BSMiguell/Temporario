/* Aetheria Codex — Transições de Página (Fase A) */
/* Arquitetura: RITUALS[groupKey] = fn(cardEl, modalEl, groupColor) */
/* Os rituais rodam entre o clique e a troca de conteúdo; para 05_Demonios, roda como overlay de página. */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  const RITUALS = {};

  /* --- Helpers --- */
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function runAfter(ms, fn) { setTimeout(fn, ms); }

  /* Rit ual 03 — Ordens e Guerreiros: Baixar de estandarte */
  RITUALS['03_Ordens_E_Guerreiros'] = function (card, modal, color) {
    if (prefersReduced) return;
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
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
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
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
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
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
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
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
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
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
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
    card.classList.add('ritual-19-axe');
    modal.classList.add('ritual-19-modal');
    runAfter(800, function () {
      card.classList.remove('ritual-19-axe');
      modal.classList.remove('ritual-19-modal');
    });
  };

  /* Ritual 05 — Demônios: Portão do Inferno (design atualizado pelo ritual-05.html) */
  RITUALS['05_Demonios'] = function (card, modal, color) {
    if (prefersReduced) return;
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
    if (!document.getElementById('trans-05-style')) {
      var s = document.createElement('style');
      s.id = 'trans-05-style';
      s.textContent = '\
        @keyframes gateLOpen { 0% { transform: rotateY(0deg) translateX(0); } 55% { transform: rotateY(-8deg) translateX(-2%); } 100% { transform: rotateY(-72deg) translateX(-38%); } }\
        @keyframes gateROpen { 0% { transform: rotateY(0deg) translateX(0); } 55% { transform: rotateY(8deg) translateX(2%); } 100% { transform: rotateY(72deg) translateX(38%); } }\
        @keyframes seamPulse { 0%, 100% { opacity: 0.65; filter: blur(4px); } 50% { opacity: 1; filter: blur(7px); } }\
        @keyframes rise { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-110vh) translateX(var(--drift, 20px)); opacity: 0; } }\
        @keyframes flash { 0% { opacity: 0; } 8% { opacity: 0.9; } 18% { opacity: 0.1; } 28% { opacity: 0.7; } 45% { opacity: 0; } 100% { opacity: 0; } }\
        @keyframes shake { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-6px, 3px) rotate(-0.3deg); } 20% { transform: translate(5px, -4px) rotate(0.3deg); } 30% { transform: translate(-4px, 4px); } 40% { transform: translate(6px, -2px); } 50% { transform: translate(-3px, 2px); } 60% { transform: translate(3px, -3px); } 70% { transform: translate(-2px, 1px); } 80%, 100% { transform: translate(0, 0); } }\
        .trans-05-stage { position: fixed; inset: 0; z-index: 9999; pointer-events: none; background: radial-gradient(ellipse at 50% 100%, #1a0206 0%, #000 70%); overflow: hidden; display: flex; align-items: center; justify-content: center; }\
        .trans-05-portal { position: relative; width: 100%; height: 100%; border-radius: 0; overflow: hidden; box-shadow: none; }\
        .trans-05-seam { position: absolute; top: 0; left: 50%; width: 14px; height: 100%; transform: translateX(-50%); background: linear-gradient(180deg, #000 0%, #8E44AD 35%, #b07cc6 50%, #8E44AD 65%, #000 100%); filter: blur(4px); box-shadow: 0 0 60px 20px rgba(255,90,31,0.9); animation: seamPulse 2.4s ease-in-out infinite; z-index: 1; }\
        .trans-05-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; z-index: 20; }\
        .trans-05-flash.active { animation: flash 0.35s ease-out; }\
        .trans-05-gate { position: absolute; top: 0; width: 50%; height: 100%; background-size: cover; z-index: 3; }\
        .trans-05-gate.left { left: 0; transform-origin: left center; background: radial-gradient(circle at 85% 20%, rgba(192,38,211,0.1), transparent 40%), repeating-linear-gradient(115deg, #3d1420 0 3px, #2b0f1a 3px 7px), linear-gradient(100deg, #0a0206 0%, #1a0a12 30%, #2b0f1a 55%, #3d1420 80%, #0a0206 100%); border-right: 4px solid #000; box-shadow: inset -50px 0 90px rgba(0,0,0,0.95), inset 24px 0 50px rgba(139,13,31,0.15); animation: gateLOpen 2.4s cubic-bezier(0.68,-0.15,0.22,1.02) 0.3s both; }\
        .trans-05-gate.right { right: 0; transform-origin: right center; background: radial-gradient(circle at 15% 20%, rgba(192,38,211,0.1), transparent 40%), repeating-linear-gradient(-115deg, #3d1420 0 3px, #2b0f1a 3px 7px), linear-gradient(-100deg, #0a0206 0%, #1a0a12 30%, #2b0f1a 55%, #3d1420 80%, #0a0206 100%); border-left: 4px solid #000; box-shadow: inset 50px 0 90px rgba(0,0,0,0.95), inset -24px 0 50px rgba(139,13,31,0.15); animation: gateROpen 2.4s cubic-bezier(0.68,-0.15,0.22,1.02) 0.3s both; }\
        .trans-05-rivets { position: absolute; top: 0; bottom: 0; width: 16px; display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; z-index: 4; }\
        .trans-05-rivets.left { right: 2px; }\
        .trans-05-rivets.right { left: 2px; }\
        .trans-05-rivet { width: 10px; height: 10px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #6b6b6b, #1a1a1a 70%); box-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 6px rgba(192,38,211,0.4); }\
        .trans-05-ember { position: absolute; bottom: -10px; border-radius: 50%; background: radial-gradient(circle, #ffb347, #ff5a1f 60%, transparent 100%); box-shadow: 0 0 8px 2px #ff5a1f; animation: rise linear infinite; z-index: 5; pointer-events: none; }\
        .trans-05-shake { animation: shake 0.6s ease-out; }';
      document.head.appendChild(s);
    }

    var stage = document.createElement('div');
    stage.className = 'trans-05-stage';
    stage.innerHTML = '\
      <div class="trans-05-portal">\
        <div class="trans-05-seam"></div>\
        <div class="trans-05-flash"></div>\
      </div>';
    document.body.appendChild(stage);

    var portal = stage.querySelector('.trans-05-portal');

    // Gates
    function skullSVG() {
      return '<svg class="trans-05-skull" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:6%;width:15%;opacity:0.9;filter:drop-shadow(0 0 6px rgba(0,0,0,0.8));"><path d="M50 8 C25 8 12 28 12 48 C12 62 20 72 24 78 L24 88 L34 88 L34 80 L40 80 L40 88 L60 88 L60 80 L66 80 L66 88 L76 88 L76 78 C80 72 88 62 88 48 C88 28 75 8 50 8 Z" fill="#0a0a0a" stroke="#3d1420" stroke-width="2"/><ellipse cx="34" cy="46" rx="9" ry="12" fill="#000"/><ellipse cx="66" cy="46" rx="9" ry="12" fill="#000"/><circle cx="34" cy="46" r="3" fill="#ff5a1f"/><circle cx="66" cy="46" r="3" fill="#ff5a1f"/></svg>';
    }
    function chainSVG() {
      return '<svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><g>' + Array.from({ length: 9 }).map(function(_, i) {
        return '<ellipse cx="' + (i * 24 + 10) + '" cy="' + (i % 2 === 0 ? 14 : 26) + '" rx="11" ry="15" fill="none" stroke="#1c1c1c" stroke-width="4"/><ellipse cx="' + (i * 24 + 10) + '" cy="' + (i % 2 === 0 ? 14 : 26) + '" rx="11" ry="15" fill="none" stroke="#4d4d4d" stroke-width="1.5"/>';
      }).join('') + '</g></svg>';
    }
    function crackSVG(mirror) {
      var s = mirror ? 95 : 5; var e1 = mirror ? 88 : 12; var e2 = mirror ? 92 : 8; var e3 = mirror ? 83 : 17; var e4 = mirror ? 90 : 10; var e5 = mirror ? 85 : 15; var e6 = mirror ? 89 : 11;
      return '<svg class="trans-05-crack" viewBox="0 0 100 400" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;"><path d="M' + s + ' 0 L' + e1 + ' 60 L' + e2 + ' 110 L' + e3 + ' 170 L' + e4 + ' 230 L' + e5 + ' 300 L' + e6 + ' 400" stroke="#ff5a1f" stroke-width="1.4" fill="none" opacity="0.9"/></svg>';
    }

    function buildGate(side) {
      var g = document.createElement('div');
      g.className = 'trans-05-gate ' + side;
      g.innerHTML = '\
        <div style="position:absolute;inset:0;overflow:hidden;">\
          ' + crackSVG(side === 'right') + '\
          <div style="position:absolute;top:8%;' + (side === 'left' ? 'right:8%;' : 'left:8%;') + 'width:65%;height:84%;filter:drop-shadow(0 0 10px #8E44AD);animation:runePulse 3s ease-in-out infinite;">\
            <svg viewBox="0 0 120 320" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;"><path d="M60 15 L60 95 M28 38 L92 38 M28 68 L92 68 M42 53 L78 53" stroke="#8E44AD" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="60" cy="118" r="17" stroke="#8E44AD" stroke-width="2" fill="none"/><path d="M60 101 L60 135 M43 118 L77 118" stroke="#8E44AD" stroke-width="2" fill="none"/><path d="M60 155 L60 230" stroke="#8E44AD" stroke-width="2.5" fill="none"/></svg>\
          </div>\
          <div style="position:absolute;top:0;bottom:0;' + (side === 'left' ? 'right:2px;' : 'left:2px;') + 'width:16px;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;z-index:4;">' + Array.from({ length: 10 }).map(function() { return '<div style="width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #6b6b6b, #1a1a1a 70%);box-shadow:0 0 4px rgba(0,0,0,0.9), 0 0 6px rgba(192,38,211,0.4);"></div>'; }).join('') + '</div>\
          ' + skullSVG() + '\
          <div style="position:absolute;top:38%;' + (side === 'left' ? 'right:-6%;' : 'left:-6%;') + 'width:60%;height:10%;z-index:6;transform-origin:center;animation:chainSnap' + (side === 'left' ? 'L' : 'R') + ' 0.9s ease-in 1.1s forwards;">' + chainSVG() + '</div>\
        </div>';
      return g;
    }

    portal.appendChild(buildGate('left'));
    portal.appendChild(buildGate('right'));

    // Ember particles
    for (var i = 0; i < 26; i++) {
      var e = document.createElement('div');
      e.className = 'trans-05-ember';
      var size = 2 + Math.random() * 4;
      e.style.width = size + 'px';
      e.style.height = size + 'px';
      e.style.left = (10 + Math.random() * 80) + '%';
      e.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
      e.style.animationDuration = (3 + Math.random() * 4) + 's';
      e.style.animationDelay = (Math.random() * 3) + 's';
      portal.appendChild(e);
    }

    // Flash + shake
    var flash = stage.querySelector('.trans-05-flash');
    runAfter(250, function () { flash.classList.add('active'); });
    runAfter(300, function () { stage.classList.add('trans-05-shake'); });
    runAfter(1000, function () { stage.classList.remove('trans-05-shake'); flash.classList.remove('active'); });

    // Remover após 2700ms (duração completa do portão + replay)
    runAfter(2700, function () {
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    });
  };


  /* Ritual 04 — Onis: Transição com vídeo (onis-transition.mp4) */
  RITUALS['04_Onis'] = function (card, modal, color) {
    if (prefersReduced) return;
    if (sessionStorage.getItem('onisVideoPlayed') === '1') return;
    if (document.getElementById('trans-04-video')) return;

    var stage = document.createElement('div');
    stage.id = 'trans-04-video';
    stage.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0a0206;display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none;';

    var video = document.createElement('video');
    var vidPath = (window.location.pathname.indexOf("racas/") !== -1) ? "../assets/videos/onis-transition.mp4" : "assets/videos/onis-transition.mp4"; video.src = vidPath;
    video.style.cssText = 'width:100vw;height:100vh;object-fit:cover;opacity:0.92;';
    video.autoplay = true;
    video.muted = false;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    sessionStorage.setItem('onisVideoPlayed', '1');
    video.setAttribute('webkit-playsinline', '');

    var bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, #3d0f0f 0%, #0a0206 70%);z-index:-1;';
    stage.appendChild(bg);
    stage.appendChild(video);
    document.body.appendChild(stage);

    video.addEventListener('ended', function () {
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    });
    setTimeout(function () {
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    }, 4000);
  };
  /* Fallback generico */
  function ritualFallback(card, modal, color) {}

  /* Expor */
  window.AETHERIA_RITUALS = RITUALS;
  window.runRitual = function (groupKey, cardEl, modalEl, groupColor) {
    var fn = RITUALS[groupKey] || ritualFallback;
    try { fn(cardEl, modalEl, groupColor); } catch (e) {}
  };
})();

