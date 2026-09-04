// timeline-data.js
// Consumido por Linha_do_Tempo.html. Fornece as 4 labels canônicas dos atos
// (mesmo padrão de Mapa_Aetheria NARR_TITULOS) e o helper `load()` que puxa
// a historia-api.json e devolve as 5 battles ordenadas cronologicamente.
//
// Por que JS separado e não inline no HTML: o arquivo pode ser cacheado pelo
// browser e compartilhado com futuras timelines (ex: timeline de personagem
// específico, ou versão filtrável por raça).

(function () {
  "use strict";

  // Cores alinhadas com Mapa_Aetheria (mesmo critério visual).
  const ERAS = {
    I: { titulo: "Ato I — A Queda do Norte", cor: "#9bb5d4" },
    II: { titulo: "Ato II — Os Cumes em Chamas", cor: "#dba66b" },
    III: { titulo: "Ato III — A Ruptura da Fenda", cor: "#a25bb6" },
    IV: { titulo: "Ato IV — O Vazio Desperta", cor: "#5b8b8e" },
  };

  // Mapa data (label humano) -> peso numérico. "Verão do Vazio, ano 12 (clímax)"
  // é a mesma era de "Verão do Vazio, ano 12" mas veio DEPOIS — por isso a chave
  // exata difere. Mantemos a ordem cronológica pelo sufixo "(clímax)" quando
  // existir; se não houver, ordem por ano crescente.
  function pesoData(data) {
    // Extrai o número depois de "ano"
    const m = (data || "").match(/ano\s+(\d+)/i);
    const ano = m ? parseInt(m[1], 10) : 0;
    const climax = /\(cl[íi]max\)/i.test(data) ? 0.5 : 0;
    return ano + climax;
  }

  async function load() {
    const r = await fetch("./historia-api.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const api = await r.json();
    const battles = (api.battles || []).slice().sort((a, b) => {
      // 1º por era (I, II, III, IV), 2º por data cronológica dentro da era.
      if (a.era !== b.era) return a.era.localeCompare(b.era);
      return pesoData(a.data) - pesoData(b.data);
    });
    return battles.map((b) => ({
      id: b.id,
      nome: b.nome,
      era: b.era,
      data: b.data,
      resumo: b.resumo,
      regiao: b.regiao,
      pos: b.pos,
    }));
  }

  window.__TIMELINE__ = { ERAS, load };
})();
