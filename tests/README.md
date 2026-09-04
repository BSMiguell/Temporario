# Tests — Aetheria Codex

Smoke tests + screenshots do site usando **Playwright local** (Chromium 151).

## Pré-requisitos

1. **Servidor local** rodando em `:8080`:
   ```bash
   python -m http.server 8080
   # ou: npx serve . -l 8080
   ```
2. **Playwright** instalado (uma vez):
   ```bash
   npm install --no-save playwright
   npx playwright install chromium
   ```
   O Chromium 151 (~310 MB) baixa pra `%LOCALAPPDATA%\ms-playwright\`.

## Como rodar

```bash
# Smoke test (16 checks, exit code != 0 se falhar)
node tests/smoke.mjs

# Screenshots do site (6 PNGs em tests/screenshots/)
node tests/screenshots.mjs

# Os dois em sequência
npm run all
```

## O que o smoke valida

| #     | Check                 | Detalhe                                                             |
| ----- | --------------------- | ------------------------------------------------------------------- |
| 1     | servidor responde 200 | `/` retorna 200                                                     |
| 2-5   | hero mostra contagens | 489 chars, 22 raças, `api.totalCharacters === 489`                  |
| 6-7   | filtro Onis           | deep-link `#g=04_Onis` aplica, 18 cards na grade                    |
| 8-9   | modal                 | abre ao clicar, ficha técnica com 6 atributos                       |
| 10-11 | Ctrl+K                | paleta abre, "aat" traz Aatrox em 1º                                |
| 12-15 | mapa                  | canvas renderiza, `window.__MAPA__` ok, 26 pins, 0 erros de console |

## Screenshots gerados

| Arquivo             | O que captura                      |
| ------------------- | ---------------------------------- |
| `index-hero.png`    | Home (tema claro, destaque do dia) |
| `index-cards.png`   | Grade inicial com 18 cards         |
| `index-filtros.png` | Filtro Onis ativo (`#g=04_Onis`)   |
| `index-modal.png`   | Modal do Aatrox aberto             |
| `index-palette.png` | Paleta Ctrl+K digitando "aat"      |
| `mapa.png`          | Mapa 3D com 26 pins                |

São **PNG full-quality** (1600×1000, 1.2 MB cada). Úteis pra debug local; **não versionados** (`tests/screenshots/` no `.gitignore`).

As screenshots do **README oficial** ficam em `docs/screenshots/` (JPEG, 1600×1000, qualidade 90 — versionadas e linkadas).
