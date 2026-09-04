# pad_preambulos.py
# Sincroniza o número no preambulo de cada codex/<raca>/Aetheria_Codex_de_*.md
# com a quantidade real de fichas `## N.` no arquivo.
#
# O rotulo (entidades/criaturas/seres/cavaleiros/praticantes/divindades/...)
# e PRESERVADO: so o numero e trocado. Arquivos com preambulo ja correto
# ficam intocados.
#
# Exemplo de transformacao:
#   Antes: "registro das 26 entidades, guerreiros e campees do universo de Aetheria"
#   Depois: "registro das 24 entidades, guerreiros e campees do universo de Aetheria"
#
# O script e idempotente: rodar 2x nao muda a 2a passada. Suporta --dry-run
# (gera .md.tmp ao lado do original) e modo apply (sobrescreve o original).
#
# Uso:
#   python scripts/pad_preambulos.py --dry-run   # escreve .md.tmp em cada pasta
#   python scripts/pad_preambulos.py             # sobrescreve os 11 arquivos
#
# Risco de quebrar o parser: ZERO. O preambulo nao e parseado pelo
# build_api_json.ps1 (o script so le as fichas `## N.` e seus campos bulleted-bold).
# Os demais artefatos (build_racas.ps1, README, etc.) tambem ignoram o preambulo.

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CODEX = ROOT / "codex"

# Regex captura: "26 entidades" / "43 criaturas" / "17 divindades" / "5 entidades"
# (numero) + (espaco) + (palavra acentuada com plural opcional).
# O rotulo fica no grupo 2 e nao e alterado.
NUMERO_NO_PREAMBULO = re.compile(
    r"(\d+)\s+([A-Za-zÀ-ſ]+(?:s)?)",
    flags=re.UNICODE,
)


def contar_fichas(texto: str) -> int:
    """Conta quantas fichas `## N.` existem no arquivo (N = 1+)."""
    return len(re.findall(r"^## \d+\.", texto, flags=re.MULTILINE))


def achar_indice_primeira_ficha(texto: str) -> int:
    """Posicao do `## 1.` (ou primeira ficha) - delimita o final do preambulo."""
    m = re.search(r"^## \d+\.", texto, flags=re.MULTILINE)
    if not m:
        raise ValueError("Nao achei `## N.` no arquivo (sem fichas?)")
    return m.start()


def sincronizar(caminho: Path) -> tuple[int, int, str] | None:
    """Le o arquivo, sincroniza o numero do preambulo, retorna (n_antigo, n_novo, novo_preambulo) ou None se ja esta OK."""
    texto = caminho.read_text(encoding="utf-8")
    fim_pre = achar_indice_primeira_ficha(texto)
    preambulo = texto[:fim_pre]
    fichas = contar_fichas(texto)

    m = NUMERO_NO_PREAMBULO.search(preambulo)
    if not m:
        # Sem numero no preambulo (raro). Apenas reporta.
        return None
    n_antigo = int(m.group(1))
    if n_antigo == fichas:
        return None  # ja esta OK, nao mexe

    novo_preambulo = preambulo[: m.start(1)] + str(fichas) + preambulo[m.end(1) :]
    return n_antigo, fichas, novo_preambulo


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="escreve .md.tmp em cada pasta em vez de sobrescrever o original",
    )
    args = ap.parse_args()

    arquivos = sorted(CODEX.rglob("Aetheria_Codex_de_*.md"))
    if not arquivos:
        print("Nenhum Aetheria_Codex_de_*.md encontrado em codex/")
        return 1

    alterados = 0
    for caminho in arquivos:
        try:
            resultado = sincronizar(caminho)
        except ValueError as e:
            print(f"  SKIP {caminho.parent.name}: {e}")
            continue

        if resultado is None:
            # ja esta OK (ou sem numero no preambulo)
            print(f"  ok   {caminho.parent.name}")
            continue

        n_antigo, n_novo, novo_preambulo = resultado
        texto_original = caminho.read_text(encoding="utf-8")
        fim_pre = achar_indice_primeira_ficha(texto_original)
        novo_texto = novo_preambulo + texto_original[fim_pre:]

        # Sanidade: numero novo deve aparecer exatamente 1x no preambulo
        # e a contagem de fichas nao pode ter mudado.
        assert contar_fichas(novo_texto) == n_novo, "contagem de fichas nao bate"
        m_check = NUMERO_NO_PREAMBULO.search(novo_texto[:achar_indice_primeira_ficha(novo_texto)])
        assert m_check and int(m_check.group(1)) == n_novo, "preambulo nao atualizado"

        if args.dry_run:
            tmp = caminho.with_suffix(caminho.suffix + ".tmp")
            tmp.write_text(novo_texto, encoding="utf-8")
            print(f"  DRY  {caminho.parent.name}: {n_antigo} -> {n_novo} (escrito em {tmp.name})")
        else:
            caminho.write_text(novo_texto, encoding="utf-8")
            print(f"  OK   {caminho.parent.name}: {n_antigo} -> {n_novo}")
        alterados += 1

    print()
    print(f"Total de arquivos alterados: {alterados}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
