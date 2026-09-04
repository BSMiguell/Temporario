"""Gera docs/relatorio-arte.md — levantamento de duplicatas/orfaos para decisao do Bruno.
Somente leitura: nao apaga, nao move, nao renomeia nada."""
import json, os, hashlib, re
from collections import defaultdict
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

HOJE = date.today().isoformat()  # ISO 8601 (YYYY-MM-DD) — usado no cabeçalho e em qualquer timestamp do relatório

d = json.load(open('characters-api.json', encoding='utf-8'))
used = {c['image'] for g in d['groups'] for c in g['characters'] if c['image']}
chars_by_name = defaultdict(list)
for g in d['groups']:
    for c in g['characters']:
        # Normaliza: tira sufixo "-V-N" para detectar homônimos entre pastas
        # (ex.: "Vanek" em 12_Magos e "Vanek-V-1" em 06_Desconhecidos = mesmo nome)
        name_norm = re.sub(r'-v-' + chr(92) + 'd+$', '', c['id'].lower())  # id já em lower; chr(92)=\\
        chars_by_name[name_norm].append((g['folder'], c['id']))

def md5(p):
    h = hashlib.md5()
    with open(p, 'rb') as fh:
        h.update(fh.read())
    return h.hexdigest()[:12]

pngs = []
for root, dirs, files in os.walk('codex'):
    for f in files:
        if f.lower().endswith('.png'):
            rel = os.path.join(root, f).replace(os.sep, '/')
            pngs.append(rel)

orphans = [(p, os.path.getsize(p) // 1024, md5(p)) for p in pngs if p not in used]

byhash = defaultdict(list)
for p in pngs:
    byhash[md5(p)].append(p)
cross_dupes = {h: v for h, v in byhash.items() if len({p.split('/')[1] for p in v}) > 1}

# homonimos entre pastas (mesmo nome de personagem em pastas diferentes)
homonyms = {n: v for n, v in chars_by_name.items() if len({f for f, _ in v}) > 1}

L = []
L.append('# Relatório de Arte — pendências para decisão')
L.append('')
L.append(f'> Gerado em {HOJE} por `scripts/relatorio_arte.py` (somente leitura).')
L.append('> **Nada foi apagado ou movido.** Cada item abaixo aguarda decisão do Bruno.')
L.append('')
L.append(f'Acervo atual: **{len(pngs)} PNGs** em `codex/` · {d["totalCharacters"]} personagens no site · {len(used)} artes em uso.')
L.append('')

# Seção 1 (removida): a "ressurreição" dos 10 personagens removidos em 25/08 não é
# detectável de forma confiável por este script (não temos baseline histórico do que
# existia antes da remoção). O estado atual é: characters-api.json tem 487 chars,
# todos com image. Para auditoria de ressurreição, conferir o git log do .md antes
# do commit da remoção.

L.append(f'## 1. PNGs órfãos ({len(orphans)}) — nenhuma ficha os usa')
L.append('')
L.append('Personagens que saíram das fichas deixando arte para trás. Manter (arquivo morto) ou apagar.')
L.append('')
L.append('| Arquivo | Tamanho | MD5-8 |')
L.append('|---|---|---|')
for rel, kb, h in sorted(orphans):
    L.append(f'| `{rel}` | {kb} KB | `{h}` |')
L.append('')

if cross_dupes:
    L.append(f'## 2. Cópia BYTE-A-BYTE idêntica em pastas diferentes ({len(cross_dupes)} grupos)')
    L.append('')
    L.append('Mesmo hash MD5 em pastas distintas — cópia redundante garantida (não é variante de arte).')
    L.append('')
else:
    L.append('## 2. Cópia idêntica entre pastas')
    L.append('')
    L.append('Nenhuma encontrada — todos os nomes repetidos entre pastas têm hashes diferentes (artes distintas ou variantes).')
    L.append('')

for h, v in sorted(cross_dupes.items()):
    L.append(f'- `{h}`:')
    for p in v:
        L.append(f'  - `{p}` ({os.path.getsize(p)//1024} KB)')
L.append('')

L.append(f'## 3. Homônimos entre pastas ({len(homonyms)} nomes)')
L.append('')
L.append('Mesmo nome de personagem em pastas diferentes — podem ser versões alternativas intencionais do mesmo ente (o grafo do `/graphify` já os marca como `semantically_similar_to`). **Confirmar antes de qualquer merge.**')
L.append('')
L.append('| Nome | Onde aparece |')
L.append('|---|---|')
for n in sorted(homonyms):
    places = ', '.join(f'`{f}`' for f, _ in homonyms[n])
    L.append(f'| {homonyms[n][0][1]} | {places} |')
L.append('')

L.append('## 4. Quase-duplicatas intra-pasta apontadas no Memoria.md')
L.append('')
intra = [('02_Mutantes', ['Lobisomem-V-1', 'Lobisomem-V-2', 'Lobisomem-V-3']),
         ('06_Desconhecidos', ['Noxaris', 'Noxaris-V-1']),
         ('14_Demonios_Do_Caos', ['Maw-Shin', 'Maw-Shin-V-1'])]
L.append('| Pasta | Arquivos | Hashes distintos? |')
L.append('|---|---|---|')
for folder, names in intra:
    hashes = []
    for n in names:
        p = f'codex/{folder}/{n}.png'
        hashes.append(md5(p) if os.path.exists(p) else 'AUSENTE')
    same = 'SIM (mesmo arquivo!)' if len(set(hashes)) == 1 else 'não — artes/variantes distintas'
    L.append(f'| `{folder}` | {" · ".join(f"`{n}.png`" for n in names)} | {same} |')
L.append('')

out = os.path.join('docs', 'relatorio-arte.md')
open(out, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('OK:', out)
print('orfaos:', len(orphans), '| hashes iguais entre pastas:', len(cross_dupes), '| homonimos:', len(homonyms))
