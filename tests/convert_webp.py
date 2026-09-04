"""
convert_webp.py — converte PNGs do codex/ para WebP.
Uso: python tests/convert_webp.py [--limit N] [--quality 80] [--dry-run]
- Varre codex/**/*.png
- Cria .webp ao lado do .png
- NÃO apaga o .png (fallback via <picture>)
- Relatório: total, economizado (KB / %)
"""
import os, sys, glob, time
from pathlib import Path
from PIL import Image
import argparse

ROOT = Path(__file__).parent.parent
CODEX = ROOT / "codex"

def fmt(n):
    for u in ['B','KB','MB','GB']:
        if n < 1024: return f"{n:.1f}{u}"
        n /= 1024
    return f"{n:.1f}TB"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="0 = todos")
    ap.add_argument("--quality", type=int, default=80, help="qualidade WebP (1-100)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-existing", action="store_true", default=True)
    args = ap.parse_args()

    pngs = sorted(CODEX.rglob("*.png"))
    if args.limit: pngs = pngs[:args.limit]

    print(f"Encontrados {len(pngs)} PNGs")
    if args.dry_run:
        total_size = sum(p.stat().st_size for p in pngs)
        print(f"Tamanho total: {fmt(total_size)}")
        return

    t0 = time.time()
    converted = 0
    saved = 0
    errors = []
    for i, p in enumerate(pngs, 1):
        out = p.with_suffix(".webp")
        if args.skip_existing and out.exists():
            # só conta economia
            try:
                saved += p.stat().st_size - out.stat().st_size
                converted += 1
            except: pass
            continue
        try:
            with Image.open(p) as img:
                # converte pra RGB se for RGBA, mantém transparência se vier de RGBA
                if img.mode == "P":
                    img = img.convert("RGBA" if "transparency" in img.info else "RGB")
                img.save(out, "WEBP", quality=args.quality, method=6, lossless=False)
            saved += p.stat().st_size - out.stat().st_size
            converted += 1
        except Exception as e:
            errors.append((p, str(e)))
        if i % 50 == 0:
            print(f"  {i}/{len(pngs)} ({fmt(saved)} economizado)")

    dt = time.time() - t0
    print(f"\n=== {converted} convertidos em {dt:.1f}s ===")
    print(f"Economia: {fmt(saved)}")
    if errors:
        print(f"\n⚠️ {len(errors)} erros:")
        for p, e in errors[:10]: print(f"  {p.name}: {e}")

if __name__ == "__main__":
    main()
