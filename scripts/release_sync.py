#!/usr/bin/env python3
"""Audit published portfolio data against authoritative GitHub releases."""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data" / "products.json"
API_ROOT = "https://api.github.com/repos"
USER_AGENT = "stanleyll0yd-portfolio-release-audit/1"


def load_registry() -> list[dict[str, Any]]:
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1:
        raise ValueError("Unsupported product registry schema")
    products = data.get("products")
    if not isinstance(products, list) or not products:
        raise ValueError("Product registry is empty")
    return products


def request_json(url: str) -> dict[str, Any]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers)
    with urlopen(request, timeout=12) as response:
        return json.load(response)


def normalized_version(tag: str) -> str:
    return tag[1:] if tag.startswith("v") else tag


def local_surface_issues(product: dict[str, Any]) -> list[str]:
    version = product["version"]
    token = f"v{version}"
    issues: list[str] = []
    for relative_path in ("index.html", product["page"]):
        path = ROOT / relative_path
        if not path.is_file():
            issues.append(f"missing surface: {relative_path}")
            continue
        if token not in path.read_text(encoding="utf-8"):
            issues.append(f"{relative_path} does not contain {token}")
    icon = ROOT / product["site_icon"]
    if not icon.is_file():
        issues.append(f"missing site icon: {product['site_icon']}")
    return issues


def remote_audit(product: dict[str, Any], check_icon: bool) -> dict[str, Any]:
    repo = product["repo"]
    release = request_json(f"{API_ROOT}/{repo}/releases/latest")
    release_version = normalized_version(str(release.get("tag_name", "")))
    expected_version = product["version"]
    asset_names = {
        str(asset.get("name", ""))
        for asset in release.get("assets", [])
        if isinstance(asset, dict)
    }

    issues: list[str] = []
    if release_version != expected_version:
        issues.append(f"release {release_version or '<unknown>'} != registry {expected_version}")

    missing_assets = []
    for template in product.get("asset_patterns", []):
        pattern = template.format(version=expected_version)
        if not any(fnmatch.fnmatchcase(name, pattern) for name in asset_names):
            missing_assets.append(pattern)
    if missing_assets:
        issues.append("missing release asset(s): " + ", ".join(missing_assets))

    icon_sha = None
    if check_icon:
        source = product.get("source_icon")
        if source:
            encoded_path = quote(source["path"], safe="/")
            metadata = request_json(f"{API_ROOT}/{repo}/contents/{encoded_path}")
            icon_sha = metadata.get("sha")
            if icon_sha != source["sha"]:
                issues.append(f"source icon changed: {source['path']}")

    return {
        "id": product["id"],
        "name": product["name"],
        "registry_version": expected_version,
        "release_version": release_version,
        "release_url": release.get("html_url"),
        "published_at": release.get("published_at"),
        "asset_names": sorted(asset_names),
        "icon_sha": icon_sha,
        "issues": issues,
    }


def audit_product(product: dict[str, Any], check_icon: bool) -> dict[str, Any]:
    result = {
        "id": product["id"],
        "name": product["name"],
        "registry_version": product["version"],
        "release_version": None,
        "release_url": None,
        "published_at": None,
        "asset_names": [],
        "icon_sha": None,
        "issues": local_surface_issues(product),
    }
    try:
        remote = remote_audit(product, check_icon)
        result.update({key: value for key, value in remote.items() if key != "issues"})
        result["issues"].extend(remote["issues"])
    except HTTPError as exc:
        result["issues"].append(f"GitHub API returned HTTP {exc.code}")
    except (URLError, TimeoutError):
        result["issues"].append("GitHub API request failed")
    return result


def print_human(results: list[dict[str, Any]], check_icons: bool) -> None:
    print("Product release audit")
    print("=" * 72)
    for result in results:
        status = "OK" if not result["issues"] else "DRIFT"
        remote = result["release_version"] or "?"
        print(
            f"{status:5}  {result['name']:<20} "
            f"site {result['registry_version']:<8} latest {remote}"
        )
        for issue in result["issues"]:
            print(f"       - {issue}")
        if check_icons and result["icon_sha"] and not any(
            issue.startswith("source icon changed") for issue in result["issues"]
        ):
            print("       - source icon: unchanged")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compare the published portfolio with authoritative GitHub releases."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="exit with status 1 when any release, asset, surface or icon is out of sync",
    )
    parser.add_argument(
        "--icons",
        action="store_true",
        help="also compare canonical source-icon blob SHAs with the registry",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="emit machine-readable JSON instead of the human report",
    )
    args = parser.parse_args()

    try:
        products = load_registry()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Release audit configuration error: {exc}", file=sys.stderr)
        return 2

    results: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=min(8, len(products))) as executor:
        futures = {
            executor.submit(audit_product, product, args.icons): product["id"]
            for product in products
        }
        for future in as_completed(futures):
            results.append(future.result())

    order = {product["id"]: index for index, product in enumerate(products)}
    results.sort(key=lambda item: order[item["id"]])

    if args.json_output:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print_human(results, args.icons)

    has_issues = any(result["issues"] for result in results)
    return 1 if args.check and has_issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
