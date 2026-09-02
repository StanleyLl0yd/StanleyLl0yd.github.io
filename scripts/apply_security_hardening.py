from __future__ import annotations

from pathlib import Path

CSP = (
    "<meta http-equiv=\"Content-Security-Policy\" "
    "content=\"default-src 'none'; base-uri 'none'; form-action 'none'; "
    "object-src 'none'; script-src 'self'; script-src-attr 'none'; "
    "style-src 'self'; style-src-elem 'self'; style-src-attr 'unsafe-inline'; "
    "img-src 'self'; font-src 'self'; connect-src 'none'; child-src 'none'; "
    "frame-src 'none'; media-src 'none'; manifest-src 'none'; worker-src 'none'; "
    "upgrade-insecure-requests; trusted-types 'none'; require-trusted-types-for 'script'\">"
)
REFERRER = '<meta name="referrer" content="no-referrer">'


def harden_html(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    if "Content-Security-Policy" not in text:
        charset_variants = ('<meta charset="utf-8">', '<meta charset="utf-8"/>')
        for marker in charset_variants:
            if marker in text:
                text = text.replace(marker, f"{marker}\n  {CSP}\n  {REFERRER}", 1)
                break
        else:
            raise RuntimeError(f"No UTF-8 charset marker in {path}")
    elif 'name="referrer" content="no-referrer"' not in text:
        text = text.replace("Content-Security-Policy\"", "Content-Security-Policy\"", 1)
        head_end = text.find("</head>")
        if head_end < 0:
            raise RuntimeError(f"No </head> in {path}")
        text = text[:head_end] + f"  {REFERRER}\n" + text[head_end:]

    # Defense in depth for external navigation privacy. Existing noopener is kept.
    text = text.replace('rel="noopener"', 'rel="noopener noreferrer"')
    text = text.replace('rel="me noopener"', 'rel="me noopener noreferrer"')

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def harden_script(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    marker = 'root.classList.add("frame-blocked")'
    if marker not in text:
        prefix = """(() => {\n  \"use strict\";\n  const root=document.documentElement;\n  if(window.top!==window.self){\n    root.classList.add(\"frame-blocked\");\n    try{window.top.location.replace(window.self.location.href)}catch{}\n    return;\n  }\n"""
        if not text.startswith("(() => {\n"):
            raise RuntimeError("Unexpected script.js wrapper")
        text = prefix + text[len("(() => {\n"):]
        text = text.replace(
            '  const root=document.documentElement; const storedLang=',
            '  const storedLang=',
            1,
        )
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def harden_css(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    rule = ".frame-blocked body{display:none!important}\n"
    if rule.strip() not in text:
        text = rule + text
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed: list[str] = []
    for path in sorted(Path(".").rglob("*.html")):
        if ".git" in path.parts:
            continue
        if harden_html(path):
            changed.append(str(path))

    if harden_script(Path("script.js")):
        changed.append("script.js")
    if harden_css(Path("styles.css")):
        changed.append("styles.css")

    print("Hardened files:")
    for item in changed:
        print(f"- {item}")


if __name__ == "__main__":
    main()
