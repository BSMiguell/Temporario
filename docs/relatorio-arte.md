# Relatório de Arte — pendências para decisão

> Gerado em 26/08/2026 por `scripts/relatorio_arte.py` (somente leitura).
> **Nada foi apagado ou movido.** Cada item abaixo aguarda decisão do Bruno.

Acervo atual: **458 PNGs** em `codex/` · 460 personagens no site · 450 artes em uso.

## 1. Personagens nas fichas-fonte `.md` que ressuscitam a cada build (10)

Removidos do site em 25/08 por decisão do Bruno, mas **ainda existem nos `.md`**;
o `build_api_json.ps1` os traz de volta (460 no lugar de 450). Opções: remover os blocos das fontes ou aceitar o retorno permanente.

| Pasta | Nome | Título |
|---|---|---|
| `01_Humanos` | `Davy-Jones-V-2` | Davy-Jones-V-2, o Capitão do Abismo Sem Fundo |
| `01_Humanos` | `Rocks-D-Xebec` | Rocks-D-Xebec, o Almirante da Desordem |
| `01_Humanos` | `Scopper-Gaban-V-1` | Scopper-Gaban-V-1, o Primeiro Escudo do Mar |
| `01_Humanos` | `Shamrock` | Shamrock, o Espadachim da Coroa Partida |
| `01_Humanos` | `Shanks-V-2` | Shanks-V-2, o Imperador da Maré Vermelha |
| `01_Humanos` | `Star-and-Stripe-V-1` | Star-and-Stripe-V-1, a Heroína da Ordem Absoluta |
| `03_Ordens_E_Guerreiros` | `Shao-Kahn-V-1` | Shao-Kahn-V-1 |
| `04_Onis` | `Akuma-Ghen-V-2` | Akuma-Ghen-V-2 |
| `15_Os_Aspectos` | `Corvus` | Corvus, o Aspecto da Vontade Astral |
| `18_Canibais` | `Nyxar` | Nyxar, o Senhor do Capuz do Eclipse |

## 2. PNGs órfãos (8) — nenhuma ficha os usa

Personagens que saíram das fichas deixando arte para trás. Manter (arquivo morto) ou apagar.

| Arquivo | Tamanho | MD5-8 |
|---|---|---|
| `codex/01_Humanos/Vice-Almirante-Bastille.png` | 2409 KB | `b7db502912dd` |
| `codex/01_Humanos/Zaraki-Kenpachi-V-1.png` | 2894 KB | `e1c3ea367f93` |
| `codex/03_Ordens_E_Guerreiros/Lunar.png` | 3612 KB | `5a980afb496f` |
| `codex/04_Onis/Shikotsumaru-V-1.png` | 4293 KB | `d8c777a20bb2` |
| `codex/04_Onis/Tatsuya-V-1.png` | 4887 KB | `f11652ec7656` |
| `codex/06_Desconhecidos/Florivax-V-1.png` | 4120 KB | `5ec48eea6370` |
| `codex/06_Desconhecidos/Mellifera-V-1.png` | 3149 KB | `d9c32f5c3a9c` |
| `codex/06_Desconhecidos/Nocteris-V-1.png` | 2982 KB | `ee9c97766d67` |

## 3. Cópia BYTE-A-BYTE idêntica em pastas diferentes (2 grupos)

Mesmo hash MD5 em pastas distintas — cópia redundante garantida (não é variante de arte).

- `8317058554d1`:
  - `codex/05_Demonios/Apoliom-V-1.png` (5040 KB)
  - `codex/09_Semi_Deuses/Azazel-V-1.png` (5040 KB)
- `e55af43ddd60`:
  - `codex/09_Semi_Deuses/Imu-V-1.png` (4577 KB)
  - `codex/21_Demonios_Akuma-Gani/Imu-Nerona.png` (4577 KB)

## 4. Homônimos entre pastas (9 nomes)

Mesmo nome de personagem em pastas diferentes — podem ser versões alternativas intencionais do mesmo ente (o grafo do `/graphify` já os marca como `semantically_similar_to`). **Confirmar antes de qualquer merge.**

| Nome | Onde aparece |
|---|---|
| Aetheron | `12_Magos`, `14_Demonios_Do_Caos` |
| Corvus-V-1 | `06_Desconhecidos`, `12_Magos` |
| Florivax | `13_Deuses`, `14_Demonios_Do_Caos` |
| Maw-Shin | `03_Ordens_E_Guerreiros`, `14_Demonios_Do_Caos` |
| Nyxar | `14_Demonios_Do_Caos`, `18_Canibais`, `18_Canibais` |
| Shao-Kahn-V-1 | `03_Ordens_E_Guerreiros`, `08_Monstros` |
| Stellaris | `10_Os_Observadores`, `14_Demonios_Do_Caos` |
| Ulthar | `02_Mutantes`, `13_Deuses` |
| Vanek | `12_Magos`, `13_Deuses` |

**Descoberta extra:** `Nyxar` aparece DUAS VEZES na mesma ficha de `18_Canibais`
(entrada `## 5.` COM arte e entrada `## 17.` SEM arte, título e história idênticos).
É uma duplicata real dentro do `.md` — candidata clara à remoção da entrada `## 17.`.

## 5. Quase-duplicatas intra-pasta apontadas no Memoria.md

| Pasta | Arquivos | Hashes distintos? |
|---|---|---|
| `02_Mutantes` | `Lobisomem-V-1.png` · `Lobisomem-V-2.png` · `Lobisomem-V-3.png` | não — artes/variantes distintas |
| `06_Desconhecidos` | `Noxaris.png` · `Noxaris-V-1.png` | não — artes/variantes distintas |
| `14_Demonios_Do_Caos` | `Maw-Shin.png` · `Maw-Shin-V-1.png` | não — artes/variantes distintas |


