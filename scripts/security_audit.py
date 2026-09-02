from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_CSP = {
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self'",
    "style-src-elem 'self'",
    "style-src-attr 'none'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'none'",
    "child-src 'none'",
    "frame-src 'none'",
    "media-src 'none'",
    "manifest-src 'none'",
    "worker-src 'none'",
    "upgrade-insecure-requests",
    "trusted-types 'none'",
    "require-trusted-types-for 'script'",
}
TEXT_SUFFIXES = {".html", ".css", ".js", ".md", ".txt", ".xml", ".svg", ".yml", ".yaml", ".py"}
SECRET_PATTERNS = {
    "private key": re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    "GitHub token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
}
DANGEROUS_JS = {
    "eval": re.compile(r"\beval\s*\("),
    "Function constructor": re.compile(r"\bnew\s+Function\s*\("),
    "innerHTML": re.compile(r"\.innerHTML\b"),
    "outerHTML": re.compile(r"\.outerHTML\b"),
    "insertAdjacentHTML": re.compile(r"\.insertAdjacentHTML\s*\("),
    "document.write": re.compile(r"\bdocument\.write\s*\("),
}
WRITE_PERMISSION = re.compile(
    r"^\s*(?:actions|attestations|checks|contents|deployments|discussions|id-token|issues|models|packages|pages|pull-requests|repository-projects|security-events|statuses):\s*write\s*$",
    re.MULTILINE,
)


def is_external(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


class SiteParser(HTMLParser):
    def __init__(self, path: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.path = path
        self.errors: list[str] = []
        self.csp = ""
        self.referrer = ""
        self._script_has_src = False
        self._inside_script = False
        self._script_data = ""

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = {k.lower(): (v or "") for k, v in attrs_list}
        tag = tag.lower()

        for name, value in attrs.items():
            if name.startswith("on"):
                self.errors.append(f"inline event handler {name}")
            if value.strip().lower().startswith("javascript:"):
                self.errors.append(f"javascript: URL in {tag}[{name}]")

        if tag in {"form", "iframe", "object", "embed"}:
            self.errors.append(f"forbidden active/embed element <{tag}>")

        if tag == "meta":
            if attrs.get("http-equiv", "").lower() == "content-security-policy":
                self.csp = attrs.get("content", "")
            if attrs.get("name", "").lower() == "referrer":
                self.referrer = attrs.get("content", "")

        if tag == "script":
            self._inside_script = True
            self._script_data = ""
            src = attrs.get("src", "")
            self._script_has_src = bool(src)
            if src and is_external(src):
                self.errors.append(f"external script source: {src}")

        if tag in {"img", "source", "video", "audio"}:
            src = attrs.get("src", "")
            if src and is_external(src):
                self.errors.append(f"external {tag} source: {src}")

        if tag == "link":
            rel = set(attrs.get("rel", "").lower().split())
            href = attrs.get("href", "")
            if rel & {"stylesheet", "icon", "manifest", "preload", "modulepreload"} and is_external(href):
                self.errors.append(f"external subresource link: {href}")

        if tag == "a" and attrs.get("target", "").lower() == "_blank":
            rel = set(attrs.get("rel", "").lower().split())
            missing = {"noopener", "noreferrer"} - rel
            if missing:
                self.errors.append(f"target=_blank missing rel={','.join(sorted(missing))}")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "script":
            if self._inside_script and not self._script_has_src and self._script_data.strip():
                self.errors.append("inline script block")
            self._inside_script = False
            self._script_has_src = False
            self._script_data = ""

    def handle_data(self, data: str) -> None:
        if self._inside_script:
            self._script_data += data


def audit_html(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    parser = SiteParser(path)
    parser.feed(text)
    errors = list(parser.errors)

    policy = {item.strip() for item in parser.csp.split(";") if item.strip()}
    missing = REQUIRED_CSP - policy
    if missing:
        errors.append("CSP missing: " + ", ".join(sorted(missing)))
    if parser.referrer.lower() != "no-referrer":
        errors.append("referrer policy must be no-referrer")
    if "http://" in text.lower():
        errors.append("insecure http:// URL")
    return errors


def audit_javascript(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors: list[str] = []
    for name, pattern in DANGEROUS_JS.items():
        if pattern.search(text):
            errors.append(f"dangerous JS sink: {name}")
    return errors


def audit_svg(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8").lower()
    errors: list[str] = []
    for marker in ("<script", "javascript:", "onload=", "onerror=", "<foreignobject"):
        if marker in text:
            errors.append(f"active SVG content: {marker}")

    # The canonical SVG XML namespace is an identifier, not a network request.
    scrubbed = text.replace("http://www.w3.org/2000/svg", "")
    if "http://" in scrubbed:
        errors.append("insecure external SVG reference")
    return errors


def audit_workflows() -> list[tuple[Path, str]]:
    errors: list[tuple[Path, str]] = []
    workflow_dir = ROOT / ".github" / "workflows"
    if not workflow_dir.exists():
        return errors
    sha_ref = re.compile(r"^[0-9a-f]{40}(?:\s*#.*)?$")
    for path in sorted(workflow_dir.glob("*.y*ml")):
        text = path.read_text(encoding="utf-8")
        if "pull_request_target:" in text:
            errors.append((path, "pull_request_target is forbidden"))
        if "write-all" in text:
            errors.append((path, "write-all permissions are forbidden"))
        if WRITE_PERMISSION.search(text):
            errors.append((path, "write-capable workflow permissions are forbidden"))
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("uses:") or stripped.startswith("- uses:"):
                value = stripped.split("uses:", 1)[1].strip()
                if "@" not in value:
                    errors.append((path, f"unpinned action: {value}"))
                    continue
                ref = value.rsplit("@", 1)[1]
                if not sha_ref.match(ref):
                    errors.append((path, f"action must be pinned to a full commit SHA: {value}"))
    return errors


def audit_secrets() -> list[tuple[Path, str]]:
    errors: list[tuple[Path, str]] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for name, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                errors.append((path, f"possible {name}"))
    return errors


def main() -> int:
    findings: list[tuple[Path, str]] = []

    if not (ROOT / ".nojekyll").exists():
        findings.append((ROOT / ".nojekyll", "missing .nojekyll for pure static deployment"))

    for path in sorted(ROOT.rglob("*.html")):
        if ".git" not in path.parts:
            findings.extend((path, error) for error in audit_html(path))
    for path in sorted(ROOT.rglob("*.js")):
        if ".git" not in path.parts:
            findings.extend((path, error) for error in audit_javascript(path))
    for path in sorted(ROOT.rglob("*.svg")):
        if ".git" not in path.parts:
            findings.extend((path, error) for error in audit_svg(path))

    findings.extend(audit_workflows())
    findings.extend(audit_secrets())

    for path in ROOT.rglob("*"):
        if path.is_symlink():
            findings.append((path, "symbolic links are forbidden in the published site"))

    if findings:
        print("Security audit failed:", file=sys.stderr)
        for path, message in findings:
            try:
                display = path.relative_to(ROOT)
            except ValueError:
                display = path
            print(f"- {display}: {message}", file=sys.stderr)
        return 1

    print("Security audit passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
