// validate-api.mjs — valida characters-api.json contra data/characters.schema.json
// Uso:    node tests/validate-api.mjs
// Requer: characters-api.json (gerado por build_api_json.ps1)
//
// Implementacao minima: nao usa ajv. Faz as checagens essenciais inline.
// Falha = exit 1. Sucesso = "OK" e exit 0.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const api = JSON.parse(readFileSync(join(root, "characters-api.json"), "utf8"));

const errors = [];
const allChars = [].concat(...Object.values(api.groups).map((g) => g.characters));

// 1. todos com name, id, folder
for (const c of allChars) {
  if (!c.name) errors.push(`${c.id || "(sem id)"}: falta name`);
  if (!c.id) errors.push(`${c.name || "(sem nome)"}: falta id`);
  if (!c.folder) errors.push(`${c.id}: falta folder`);
  if (c.folder && !/^\d{2}_/.test(c.folder)) {
    errors.push(`${c.id}: folder '${c.folder}' nao segue padrao NN_...`);
  }
}

// 2. ids NAO precisam ser unicos (homônimos em raças diferentes sao OK,
// ex: Ulthar em Deuses e em Mutantes). Mas slugs SIM (usados em deep-link).
const warnings = [];
const slugs = new Map();
for (const c of allChars) {
  if (c.slug) {
    if (slugs.has(c.slug))
      errors.push(`slug duplicado: '${c.slug}' (em ${c.folder} e ${slugs.get(c.slug)})`);
    slugs.set(c.slug, c.folder);
  }
}
// detecta ids duplicados como warning (informativo, nao bloqueia)
const idMap = new Map();
for (const c of allChars) {
  if (idMap.has(c.id))
    warnings.push(`id duplicado (homônimo): '${c.id}' em ${c.folder} e ${idMap.get(c.id)}`);
  idMap.set(c.id, c.folder);
}

// 3. imagens que existem (image)
import { existsSync } from "node:fs";
let missingImages = 0;
for (const c of allChars) {
  if (c.image && !existsSync(join(root, c.image))) {
    errors.push(`${c.id}: imagem '${c.image}' nao encontrada no disco`);
    missingImages++;
    if (missingImages >= 5) {
      errors.push("... (parou em 5 erros de imagem)");
      break;
    }
  }
}

// 4. contagens batem com o que o JSON declara
const declared = api.totalCharacters;
if (allChars.length !== declared) {
  errors.push(`totalCharacters=${declared} mas somando chars=${allChars.length}`);
}

if (errors.length) {
  console.error(`❌ ${errors.length} erros:`);
  for (const e of errors.slice(0, 20)) console.error("  - " + e);
  process.exit(1);
} else {
  let msg = `OK — ${allChars.length} chars, ${slugs.size} slugs unicos, todas imagens existem, ${api.totalGroups} grupos`;
  if (warnings.length) msg += ` (${warnings.length} aviso: ${warnings.slice(0, 3).join("; ")})`;
  console.log(msg);
}
