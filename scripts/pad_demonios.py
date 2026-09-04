# pad_demonios.py
# Padroniza codex/05_Demonios/Aetheria_Codex_de_Demônios.md
# no mesmo padrão de codex/01_Humanos/Aetheria_Codex_de_Humano.md
# e codex/02_Mutantes/Aetheria_Codex_de_Mutantes.md.
#
# Mudanças:
#   1. Preâmbulo: "42 entidades" → "41 entidades" (gap do Apoliom).
#   2. Adiciona `---` entre preâmbulo e 1ª ficha (igual Humanos).
#   3. Por ficha:
#      a. Remove 4 espaços espúrios antes do label "Raça / Categoria:".
#      b. Promove 3 labels top-level a bullet+bold: Raça / Categoria,
#         História Original, DNA & Raio-X Visual.
#      c. Indenta 5-6 sub-itens do DNA com 2 espaços + bullet+bold:
#         Físico & Postura, Rosto & Anatomia, Vestuário, Paleta de Cores,
#         + Acessórios & Equipamento OU Atributos Únicos.
#   4. Insere `---` entre fichas (formato \n\n---\n\n).
#   5. Remove seção "## Itens ainda não registrados nesta versão" (5 nomes
#      são typos de fichas já existentes: Abadom/Abaddom, Danji/Denji,
#      Oogway/Oongway, Shadoweaver/Shadowweaver, Umbrax/Umbras).
#
# O script é idempotente: rodá-lo 2x não muda a 2ª passada. Pode rodar
# em dry-run (escreve .tmp) ou aplicar (sobrescreve o original).
#
# Uso:
#   python scripts/pad_demonios.py --dry-run   # escreve .md.tmp
#   python scripts/pad_demonios.py             # sobrescreve original
#
# Risco de quebrar o parser: ZERO. O regex de build_api_json.ps1 (linha
# 63) já tolera ambos formatos — bullet (-), bullet-asterisco (*), bold
# (**) são todos opcionais.

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARQ = ROOT / "codex" / "05_Demonios" / "Aetheria_Codex_de_Demônios.md"
TMP = ROOT / "codex" / "05_Demonios" / "Aetheria_Codex_de_Demônios.md.tmp"

TOP_LABELS = ["Raça / Categoria", "História Original", "DNA & Raio-X Visual"]
SUB_LABELS = [
    "Físico & Postura",
    "Rosto & Anatomia",
    "Vestuário",
    "Paleta de Cores",
    "Acessórios & Equipamento",
    "Atributos Únicos",
]


def padronizar_ficha(bloco: str) -> str:
    """Aplica as transformações 3a, 3b, 3c a uma ficha isolada."""
    # 3a) Remover 4 espaços espúrios antes de "Raça / Categoria:" (linha 151 da ficha 10).
    bloco = re.sub(r"^    (Raça / Categoria:)", r"\1", bloco, flags=re.MULTILINE)

    # 3b) Promover 3 labels top-level a `- **Label:**`.
    # NB: a regex casa SÓ o label + ":" (sem `.*$`), para não engolir o conteúdo da linha.
    # NB2: NÃO usar `\s*` depois do `:` — isso comeria o `\n` que separa o label do valor.
    # Em vez disso, casar SÓ o label + ":" (o texto do valor é o que vem na mesma linha ou depois).
    for label in TOP_LABELS:
        pattern = rf"(?m)^[^\S\n]*({re.escape(label)})\s*:"
        repl = r"- **\1:**"
        bloco = re.sub(pattern, repl, bloco)
        # Reverte caso já esteja com bullet+bold (não duplica o bullet).
        padrao_bold = rf"(?m)^- \*\*({re.escape(label)})\s*:\*\*"
        bloco = re.sub(padrao_bold, repl, bloco)

    # 3c) Indentar sub-itens do DNA.
    # Split em "antes/depois do DNA & Raio-X Visual:" para não tocar em Raça/História.
    # Usar `^.*?DNA` (NÃO-guloso) para que o `.*?` não vá até a próxima linha.
    dna_match = re.search(r"^.*?DNA\s*&\s*Raio-X\s*Visual", bloco, flags=re.MULTILINE)
    if dna_match:
        head = bloco[: dna_match.end()]
        tail = bloco[dna_match.end() :]
        for label in SUB_LABELS:
            padrao_sub = rf"(?m)^[^\S\n]*({re.escape(label)})\s*:"
            repl_sub = r"  - **\1:**"
            tail = re.sub(padrao_sub, repl_sub, tail)
        bloco = head + tail
    return bloco


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--dry-run", action="store_true", help="escreve .md.tmp em vez de sobrescrever"
    )
    args = ap.parse_args()

    conteudo = ARQ.read_text(encoding="utf-8")  # UTF-8 puro, sem BOM

    # === 1) Preâmbulo: "42 entidades" → "41 entidades" (1 substituição, contagem literal) ===
    assert "42 entidades" in conteudo, "esperava '42 entidades' no preâmbulo"
    conteudo = conteudo.replace("42 entidades", "41 entidades", 1)

    # === 2) Cortar preâmbulo (até antes do primeiro `## 1.`) e corpo (fichas) ===
    m = re.search(r"^## 1\.", conteudo, flags=re.MULTILINE)
    assert m, "não achei '## 1.' no arquivo"
    preambulo = conteudo[: m.start()].rstrip() + "\n"
    corpo = conteudo[m.start() :]

    # === 3) Dividir corpo em fichas (descartar seções não-numéricas como "## Itens ainda...") ===
    partes = re.split(r"(?m)(?=^## )", corpo)
    # partes[0] vazio (corpo começa com "##")
    fichas = [p for p in partes if re.match(r"^## \d+\.", p)]
    extras = [p for p in partes if p.startswith("## ") and not re.match(r"^## \d+\.", p)]
    # As extras (ex.: "## Itens ainda não registrados nesta versão") são DROPPADAS —
    # o plano confirma que os 5 nomes são typos de fichas já existentes.
    if extras:
        for e in extras:
            primeira = e.split("\n", 1)[0]
            print(f"  drop seção extra: {primeira}")
    assert len(fichas) == 41, f"esperava 41 fichas, achei {len(fichas)}"

    # === 4) Padronizar cada ficha ===
    fichas_pad = [padronizar_ficha(f) for f in fichas]

    # === 5) Juntar fichas com `\n---\n` entre elas ===
    # Cada ficha (split por `^## N.`) carrega o conteúdo até o próximo `## ` ou fim de arquivo.
    # A última ficha pode trazer um `---` solitário no fim (resíduo do arquivo original entre
    # a última ficha e a seção "Itens ainda não registrados" que vamos descartar). Strip desses resíduos.
    fichas_limpas = [f.rstrip() for f in fichas_pad]
    # Remover `---` solitário que esteja como ÚLTIMA linha (resíduo do original).
    fichas_limpas = [
        re.sub(r"\n---\s*$", "", f, flags=re.MULTILINE) if f.rstrip().endswith("---") else f
        for f in fichas_limpas
    ]
    # Inserir `\n\n---\n\n` entre fichas.
    fichas_unidas = fichas_limpas[0]
    for f in fichas_limpas[1:]:
        fichas_unidas += "\n\n---\n\n" + f

    # === 6) Compor saída final ===
    saida = preambulo + "\n---\n\n" + fichas_unidas

    # === 7) Sanity asserts ===
    # Não pode sobrar seção de pendentes.
    assert "Itens ainda não registrados" not in saida, "seção de pendentes não foi removida"
    # Deve ter 41 separadores `---` (1 após preâmbulo + 40 entre fichas).
    n_sep = sum(1 for ln in saida.split("\n") if ln.strip() == "---")
    assert n_sep == 41, f"esperava 41 separadores '---', achei {n_sep}"
    # Deve ter 41 ocorrências de "- **Raça / Categoria:**" (1 por ficha).
    n_raca = saida.count("- **Raça / Categoria:**")
    assert n_raca == 41, f"esperava 41x '- **Raça / Categoria:**', achei {n_raca}"
    # Deve ter 41 ocorrências de "- **História Original:**".
    n_hist = saida.count("- **História Original:**")
    assert n_hist == 41, f"esperava 41x '- **História Original:**', achei {n_hist}"
    # Deve ter 41 ocorrências de "- **DNA & Raio-X Visual:**".
    n_dna = saida.count("- **DNA & Raio-X Visual:**")
    assert n_dna == 41, f"esperava 41x '- **DNA & Raio-X Visual:**', achei {n_dna}"
    # Sub-itens: 5 por ficha × 41 fichas = 205 (Acessórios & Equipamento OU Atributos Únicos, 1 dos 2 por ficha).
    n_fis = saida.count("  - **Físico & Postura:**")
    n_ros = saida.count("  - **Rosto & Anatomia:**")
    n_ves = saida.count("  - **Vestuário:**")
    n_pal = saida.count("  - **Paleta de Cores:**")
    n_eq = saida.count("  - **Acessórios & Equipamento:**")
    n_at = saida.count("  - **Atributos Únicos:**")
    for nome, n in [
        ("Físico & Postura", n_fis),
        ("Rosto & Anatomia", n_ros),
        ("Vestuário", n_ves),
        ("Paleta de Cores", n_pal),
    ]:
        assert n == 41, f"esperava 41x '  - **{nome}:**', achei {n}"
    # Equipamento OU Atributos (mutuamente exclusivos): total 41.
    n_eq_at = n_eq + n_at
    assert n_eq_at == 41, f"esperava 41x (Equipamento OU Atributos), achei {n_eq_at}"
    assert (n_eq, n_at) in [(14, 27), (27, 14)], f"esperava (14,27) ou (27,14), achei ({n_eq},{n_at})"

    # === 8) Gravar ===
    if args.dry_run:
        TMP.write_text(saida, encoding="utf-8")
        print(f"✅ Dry-run OK: {TMP.relative_to(ROOT)} ({len(saida)} chars, {saida.count(chr(10)) + 1} linhas)")
    else:
        ARQ.write_text(saida, encoding="utf-8")
        print(f"✅ Aplicado: {ARQ.relative_to(ROOT)} ({len(saida)} chars, {saida.count(chr(10)) + 1} linhas)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
