#!/usr/bin/env python3
"""Static SEO/integrity audit for stanleyll0yd.github.io.

No network access and no third-party dependencies are required. Product facts live in
``data/products.json``; this script checks committed HTML and sitemap metadata against
that source of truth. Use ``--write-sitemap`` to regenerate sitemap.xml deterministically.
"""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "products.json"
SITEMAP_FILE = ROOT / "sitemap.xml"
ROBOTS_FILE = ROOT / "robots.txt"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.meta: dict[tuple[str, str], str] = {}
        self.links: list[tuple[str, str]] = []
        self.anchors: list[dict[str, str]] = []
        self.canonical: str | None = None
        self.images: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            if data.get("name"):
                self.meta[("name", data["name"].lower())] = data.get("content", "")
            if data.get("property"):
                self.meta[("property", data["property"].lower())] = data.get("content", "")
        elif tag == "link" and "canonical" in data.get("rel", "").lower().split():
            self.canonical = data.get("href")
        if tag in {"a", "link"} and data.get("href"):
            self.links.append((tag, data["href"]))
        if tag == "a" and data.get("href"):
            self.anchors.append(data)
        if tag in {"img", "script", "source"} and data.get("src"):
            self.links.append((tag, data["src"]))
        if tag == "img":
            self.images.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return "".join(self.title_parts).strip()


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def load_data() -> dict:
    with DATA_FILE.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if data.get("schemaVersion") != 1:
        raise SystemExit("Unsupported data/products.json schemaVersion")
    return data


def route_to_file(route: str) -> Path:
    clean = route.split("#", 1)[0].split("?", 1)[0]
    if clean == "/":
        return ROOT / "index.html"
    if clean.endswith("/"):
        return ROOT / clean.lstrip("/") / "index.html"
    return ROOT / clean.lstrip("/")


def public_routes(data: dict) -> list[tuple[str, str]]:
    routes: list[tuple[str, str]] = [("/", "1.0")]
    for product in data["released"]:
        routes.append((product["productPath"], "0.9"))
        if product.get("privacyPath"):
            routes.append((product["privacyPath"], "0.6"))
    return routes


def expected_sitemap(data: dict) -> str:
    origin = data["siteOrigin"].rstrip("/")
    lastmod = data["lastReviewed"]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for route, priority in public_routes(data):
        url = origin + ("/" if route == "/" else route)
        lines.extend([
            "  <url>",
            f"    <loc>{url}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            f"    <priority>{priority}</priority>",
            "  </url>",
        ])
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def parse_page(path: Path) -> tuple[PageParser, str]:
    text = path.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(text)
    return parser, text


def validate_local_target(source: Path, value: str) -> str | None:
    parsed = urlparse(value)
    if parsed.scheme or value.startswith("//") or value.startswith("mailto:") or value.startswith("tel:"):
        return None
    target_path = parsed.path
    if not target_path:
        return None
    if target_path.startswith("/"):
        target = route_to_file(target_path)
    else:
        target = (source.parent / target_path).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        return f"{source.relative_to(ROOT)}: local reference escapes repository: {value}"
    if not target.exists():
        return f"{source.relative_to(ROOT)}: broken local reference: {value}"
    return None


def validate_sitemap(data: dict, errors: list[str]) -> None:
    expected = expected_sitemap(data)
    actual = SITEMAP_FILE.read_text(encoding="utf-8") if SITEMAP_FILE.exists() else ""
    if actual != expected:
        fail(errors, "sitemap.xml is stale; run: python3 scripts/site_audit.py --write-sitemap")
        return
    try:
        root = ET.fromstring(actual)
    except ET.ParseError as exc:
        fail(errors, f"sitemap.xml is invalid XML: {exc}")
        return
    loc_tag = f"{{{SITEMAP_NS}}}loc"
    lastmod_tag = f"{{{SITEMAP_NS}}}lastmod"
    urls = root.findall(f"{{{SITEMAP_NS}}}url")
    expected_urls = {data["siteOrigin"].rstrip("/") + ("/" if route == "/" else route) for route, _ in public_routes(data)}
    actual_urls = {item.findtext(loc_tag, default="") for item in urls}
    if actual_urls != expected_urls:
        fail(errors, "sitemap.xml URL set does not match canonical public routes")
    for item in urls:
        if not item.findtext(lastmod_tag, default="").strip():
            fail(errors, f"sitemap entry lacks lastmod: {item.findtext(loc_tag, default='(unknown)')}")


def validate_robots(data: dict, errors: list[str]) -> None:
    if not ROBOTS_FILE.exists():
        fail(errors, "robots.txt is missing")
        return
    expected = f"Sitemap: {data['siteOrigin'].rstrip('/')}/sitemap.xml"
    text = ROBOTS_FILE.read_text(encoding="utf-8")
    if expected not in text:
        fail(errors, f"robots.txt does not advertise the canonical sitemap: {expected}")


def validate_metadata(data: dict, errors: list[str]) -> None:
    origin = data["siteOrigin"].rstrip("/")
    for route, _ in public_routes(data):
        path = route_to_file(route)
        if not path.exists():
            fail(errors, f"missing canonical page: {route}")
            continue
        parser, _ = parse_page(path)
        expected_canonical = origin + ("/" if route == "/" else route)
        if parser.canonical != expected_canonical:
            fail(errors, f"{path.relative_to(ROOT)}: canonical is {parser.canonical!r}, expected {expected_canonical!r}")
        if not parser.title:
            fail(errors, f"{path.relative_to(ROOT)}: missing <title>")
        if not parser.meta.get(("name", "description"), "").strip():
            fail(errors, f"{path.relative_to(ROOT)}: missing meta description")

    for route in ["/"] + [item["productPath"] for item in data["released"]]:
        path = route_to_file(route)
        parser, _ = parse_page(path)
        for key in ("og:title", "og:description", "og:url"):
            if not parser.meta.get(("property", key), "").strip():
                fail(errors, f"{path.relative_to(ROOT)}: missing {key}")
        if parser.meta.get(("property", "og:url")) != parser.canonical:
            fail(errors, f"{path.relative_to(ROOT)}: og:url must match canonical URL")


def validate_products(data: dict, errors: list[str]) -> None:
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    ids: set[str] = set()
    for product in data["released"]:
        product_id = product["id"]
        if product_id in ids:
            fail(errors, f"duplicate product id in data/products.json: {product_id}")
        ids.add(product_id)
        page = route_to_file(product["productPath"])
        if not page.exists():
            continue
        parser, text = parse_page(page)
        hrefs = {value for tag, value in parser.links if tag == "a"}
        version = product["currentVersion"]
        if f"v{version}" not in text:
            fail(errors, f"{page.relative_to(ROOT)}: current version v{version} not present")
        if f"v{version}" not in home:
            fail(errors, f"index.html: current version v{version} for {product_id} not present")
        icon = route_to_file(product["icon"])
        if not icon.exists():
            fail(errors, f"{product_id}: icon does not exist: {product['icon']}")
        if product["releaseUrl"] not in hrefs:
            fail(errors, f"{page.relative_to(ROOT)}: authoritative release URL not linked")
        for download in product.get("downloads", []):
            if download not in hrefs:
                fail(errors, f"{page.relative_to(ROOT)}: declared download URL not linked: {download}")
            matching = [anchor for anchor in parser.anchors if anchor.get("href") == download]
            if not matching or all(anchor.get("itemprop") != "downloadUrl" for anchor in matching):
                fail(errors, f"{page.relative_to(ROOT)}: direct binary URL must use Schema.org downloadUrl: {download}")
        rustore = product.get("rustoreUrl")
        if rustore:
            if rustore not in hrefs:
                fail(errors, f"{page.relative_to(ROOT)}: official RuStore URL not linked")
            matching = [anchor for anchor in parser.anchors if anchor.get("href") == rustore]
            if not matching or all(anchor.get("itemprop") != "installUrl" for anchor in matching):
                fail(errors, f"{page.relative_to(ROOT)}: RuStore listing must use Schema.org installUrl")
        for href in hrefs:
            parsed = urlparse(href)
            if parsed.hostname and parsed.hostname.lower().endswith("rustore.ru") and parsed.query:
                fail(errors, f"{page.relative_to(ROOT)}: RuStore URL must not contain query parameters: {href}")
        privacy = product.get("privacyPath")
        if privacy:
            privacy_page = route_to_file(privacy)
            if not privacy_page.exists():
                fail(errors, f"{product_id}: declared privacy page does not exist: {privacy}")
            if privacy not in hrefs:
                fail(errors, f"{page.relative_to(ROOT)}: privacy page is not linked")
        if not product.get("plannedScreenshots") or len(product["plannedScreenshots"]) < 3:
            fail(errors, f"{product_id}: at least three real-UI screenshot slots must be documented")
        social = product.get("socialImage")
        if social and not route_to_file(social).exists():
            fail(errors, f"{product_id}: declared social image does not exist: {social}")


def validate_internal_links(errors: list[str]) -> None:
    for path in sorted(ROOT.rglob("*.html")):
        parser, _ = parse_page(path)
        for _, target in parser.links:
            issue = validate_local_target(path, target)
            if issue:
                fail(errors, issue)
        for image in parser.images:
            if "alt" not in image:
                fail(errors, f"{path.relative_to(ROOT)}: image lacks alt attribute: {image.get('src', '(unknown)')}")
            if not image.get("width") or not image.get("height"):
                fail(errors, f"{path.relative_to(ROOT)}: image lacks explicit width/height: {image.get('src', '(unknown)')}")


def main() -> int:
    data = load_data()
    if len(sys.argv) == 2 and sys.argv[1] == "--write-sitemap":
        SITEMAP_FILE.write_text(expected_sitemap(data), encoding="utf-8")
        print(f"Wrote {SITEMAP_FILE.relative_to(ROOT)}")
        return 0
    if len(sys.argv) != 1:
        print("usage: scripts/site_audit.py [--write-sitemap]", file=sys.stderr)
        return 2

    errors: list[str] = []
    validate_sitemap(data, errors)
    validate_robots(data, errors)
    validate_metadata(data, errors)
    validate_products(data, errors)
    validate_internal_links(errors)
    if errors:
        print("Site audit failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Site audit passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
