# Relatório de Arte — pendências para decisão

> Gerado em 2026-09-02 por `scripts/relatorio_arte.py` (somente leitura).
> **Nada foi apagado ou movido.** Cada item abaixo aguarda decisão do Bruno.

Acervo atual: **493 PNGs** em `codex/` · 487 personagens no site · 487 artes em uso.

## 1. PNGs órfãos (6) — nenhuma ficha os usa

Personagens que saíram das fichas deixando arte para trás. Manter (arquivo morto) ou apagar.

| Arquivo | Tamanho | MD5-8 |
|---|---|---|
| `codex/01_Humanos/Douglas-Bullet-V-1.png` | 3677 KB | `1e4ce50263e4` |
| `codex/04_Onis/Aurelius-Oni.png` | 4175 KB | `b80bf3a8d232` |
| `codex/04_Onis/Sem-nome-1.png` | 4535 KB | `8f962a6a068d` |
| `codex/04_Onis/Sem-nome-2.png` | 4636 KB | `fd82a8be560d` |
| `codex/04_Onis/Sem-nome-3.png` | 5320 KB | `1aaf4e0d3d6c` |
| `codex/20_Amaldiçoados/Ao-Kagura.png` | 5078 KB | `77b3155fcdc1` |

## 2. Cópia idêntica entre pastas

Nenhuma encontrada — todos os nomes repetidos entre pastas têm hashes diferentes (artes distintas ou variantes).


## 3. Homônimos entre pastas (8 nomes)

Mesmo nome de personagem em pastas diferentes — podem ser versões alternativas intencionais do mesmo ente (o grafo do `/graphify` já os marca como `semantically_similar_to`). **Confirmar antes de qualquer merge.**

| Nome | Onde aparece |
|---|---|
| Aurelion-V-1 | `06_Desconhecidos`, `15_Os_Aspectos` |
| Garrion-V-1 | `14_Demonios_Do_Caos`, `15_Os_Aspectos` |
| Kyran-V-1 | `06_Desconhecidos`, `15_Os_Aspectos` |
| Nyxaris-V-1 | `06_Desconhecidos`, `10_Os_Observadores` |
| Stellaris-V-1 | `06_Desconhecidos`, `10_Os_Observadores` |
| Ulthar | `02_Mutantes`, `13_Deuses` |
| Vanek-V-1 | `06_Desconhecidos`, `12_Magos`, `13_Deuses` |
| Vespera | `02_Mutantes`, `17_Meio_Sangue` |

## 4. Quase-duplicatas intra-pasta apontadas no Memoria.md

| Pasta | Arquivos | Hashes distintos? |
|---|---|---|
| `02_Mutantes` | `Lobisomem-V-1.png` · `Lobisomem-V-2.png` · `Lobisomem-V-3.png` | não — artes/variantes distintas |
| `06_Desconhecidos` | `Noxaris.png` · `Noxaris-V-1.png` | não — artes/variantes distintas |
| `14_Demonios_Do_Caos` | `Maw-Shin.png` · `Maw-Shin-V-1.png` | SIM (mesmo arquivo!) |

