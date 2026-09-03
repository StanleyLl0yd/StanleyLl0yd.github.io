# Product release sync

The portfolio keeps release metadata in `data/products.json`. Use the registry and the read-only audit script before manually opening every product repository.

## Fast path

```bash
python3 scripts/release_sync.py --check --icons
```

The script checks all published products in parallel and reports only actionable drift:

- the latest public GitHub release versus the version recorded for the portfolio;
- expected release assets such as APK, AAB, DMG or EXE files;
- the version shown on the homepage and the product page;
- the existence of the local portfolio icon;
- with `--icons`, the canonical source-icon blob SHA in the product repository.

`GITHUB_TOKEN` may be supplied through the environment to increase the public API rate limit. The script is read-only and never prints the token.

For machine-readable output use:

```bash
python3 scripts/release_sync.py --icons --json
```

## Updating a product

1. Run the audit and work only on products reported as changed.
2. Read the authoritative release notes and, when needed, the product changelog/README.
3. Update the product page, homepage version, download destinations and recent changelog together.
4. If the canonical artwork changed, copy the authoritative source asset without redesigning it and update its SHA in `data/products.json`.
5. Update the registry version and expected release-asset patterns.
6. Re-run `python3 scripts/release_sync.py --check --icons` and `python3 scripts/security_audit.py`.
7. Use the normal short-lived branch → pull request → Security CI + CodeQL → squash merge flow.

The audit intentionally does not modify files, open pull requests or receive repository write permissions. Release freshness is a maintenance concern and must not weaken the portfolio's security boundaries.
