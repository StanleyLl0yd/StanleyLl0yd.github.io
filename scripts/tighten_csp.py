from pathlib import Path

ROOT = Path('.')

REPLACEMENTS = {
    'apps/my-cycle/index.html': (
        '<div class="game-art" style="background:linear-gradient(135deg,#FEEDE8,#fff8f5)">',
        '<div class="game-art cycle-art">',
    ),
    'apps/biorhythms/index.html': (
        '<div class="game-art" style="background:linear-gradient(135deg,#eeeaff,#eef8ff)">',
        '<div class="game-art biorhythm-art">',
    ),
    'apps/everon/index.html': (
        '<div class="game-art" style="background:radial-gradient(circle at 50% 45%,rgba(52,211,153,.16),transparent 34%),linear-gradient(145deg,#0b1220,#17263b)">',
        '<div class="game-art everon-art">',
    ),
}

for path in sorted(ROOT.rglob('*.html')):
    text = path.read_text(encoding='utf-8')
    text = text.replace("style-src-attr 'unsafe-inline'", "style-src-attr 'none'")
    replacement = REPLACEMENTS.get(path.as_posix())
    if replacement:
        old, new = replacement
        if old not in text:
            raise RuntimeError(f'Expected inline style not found in {path}')
        text = text.replace(old, new, 1)
    if ' style=' in text:
        raise RuntimeError(f'Inline style remains in {path}')
    path.write_text(text, encoding='utf-8')

css = Path('portfolio.css')
text = css.read_text(encoding='utf-8')
marker = '/* CSP-safe product art backgrounds */'
if marker not in text:
    text += '''\n\n/* CSP-safe product art backgrounds */\n.cycle-art{background:linear-gradient(135deg,#FEEDE8,#fff8f5)}\n.biorhythm-art{background:linear-gradient(135deg,#eeeaff,#eef8ff)}\n.everon-art{background:radial-gradient(circle at 50% 45%,rgba(52,211,153,.16),transparent 34%),linear-gradient(145deg,#0b1220,#17263b)}\n'''
css.write_text(text, encoding='utf-8')

audit = Path('scripts/security_audit.py')
text = audit.read_text(encoding='utf-8')
text = text.replace("\"style-src-attr 'unsafe-inline'\"", "\"style-src-attr 'none'\"")
audit.write_text(text, encoding='utf-8')
