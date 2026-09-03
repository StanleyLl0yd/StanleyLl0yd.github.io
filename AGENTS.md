# Repository Agent Rules

These rules apply to all automated coding agents and repository-wide maintenance work in this repository.

## Site identity

This repository publishes Stanley Lloyd's personal public website at `https://stanleyll0yd.github.io/`.

The site has three simultaneous roles:

1. a personal professional website and public identity for Stanley Lloyd;
2. a portfolio demonstrating his work, engineering approach, and product quality;
3. a product showcase intended to promote his applications and games and encourage visitors to learn more, try them, download them, or follow their development.

Treat the site as a public trust surface, not merely as a collection of static HTML files.

A visitor should quickly understand:

- who Stanley Lloyd is;
- what he builds;
- what distinguishes his products and engineering approach;
- which products are released and which are still in development;
- why a product may be useful or interesting;
- where to find authoritative product information and official downloads.

The site should present Stanley Lloyd and his products persuasively, confidently, and professionally without becoming misleading, exaggerated, intrusive, or generic marketing copy.

Prefer concrete benefits and verifiable differentiators over empty promotional language.

Technical detail is useful when it establishes credibility or explains a meaningful product advantage. Do not let technical detail obscure the product, the developer, or the visitor's next useful action.

## Priority order

When requirements compete, preserve priorities in this order:

1. security and integrity of the repository and published site;
2. factual accuracy and visitor trust;
3. clear presentation of Stanley Lloyd and his products;
4. product discoverability and useful conversion paths;
5. privacy;
6. accessibility and localization quality;
7. visual quality and UX;
8. technical simplicity and code minimization.

Do not improve a lower-priority goal by weakening a higher-priority one.

## Security is a non-negotiable invariant

Security controls may be strengthened, but they must not be weakened, bypassed, disabled, or relaxed merely to make implementation easier or to make CI pass.

Preserve the repository's existing security posture, including where applicable:

- protected `main` and pull-request-only changes;
- required security status checks;
- CodeQL requirements;
- secret scanning and push protection;
- `CODEOWNERS` ownership expectations;
- `SECURITY.md` and `.well-known/security.txt`;
- least-privilege GitHub Actions permissions;
- immutable full-SHA pinning for third-party Actions;
- `persist-credentials: false` for checkout unless a reviewed workflow genuinely requires credentials;
- the dedicated `scripts/security_audit.py` security invariants;
- the current restrictive Content Security Policy;
- `no-referrer` behavior;
- the absence of remote executable resources and active embeds;
- protections against dangerous JavaScript and active SVG content.

Never delete, disable, loosen, or work around a security check because it blocks a requested implementation. Prefer changing the implementation to satisfy the existing security model.

If a requested feature genuinely requires changing a security boundary, make the smallest possible change, explain the new attack surface, and require an explicit security decision rather than silently broadening policy.

## Static-site trust model

The intended trust path is:

```text
repository source
  -> protected pull request
  -> required security checks
  -> protected main
  -> GitHub Pages
  -> stanleyll0yd.github.io
```

The site is intentionally a dependency-light static site.

Do not introduce a runtime backend, serverless function, authentication system, form processor, payment flow, analytics endpoint, remote configuration service, external API dependency, or other server-side/runtime service without an explicit architectural and security decision.

Do not add password entry, payment-card entry, authentication secrets, private uploads, or other sensitive transactions to this GitHub Pages site.

If a proposed feature requires a browser-visible secret, it is architecturally unsuitable for this site.

## Published-content boundary

Assume every committed file can become publicly visible or directly downloadable.

Never commit:

- credentials, tokens, API keys, private keys, signing material, or recovery material;
- `.env` files containing secrets;
- private development notes;
- sensitive screenshots or logs;
- production data or personal data;
- unpublished security reports or exploit details;
- database dumps;
- backup copies such as `.bak`, `.old`, or ad-hoc archives containing material not intended for publication;
- generated files containing local paths, secrets, private metadata, or source material that should not be public.

A file being unlinked from the visible website does not make it private.

## Content Security Policy and browser security

Treat the Content Security Policy as an allowlist and a security boundary, not as a troubleshooting obstacle.

Preserve the restrictive default model, including the current intent of:

- `default-src 'none'`;
- local scripts only;
- local styles only;
- local images and fonts only;
- no network connections from page JavaScript;
- no forms;
- no frames or embedded active content;
- no objects;
- no workers unless explicitly introduced and reviewed;
- no inline script or inline event handlers;
- Trusted Types restrictions where supported;
- upgrade of insecure requests.

Do not add broad CSP sources such as `*`, unrestricted `https:`, `'unsafe-inline'`, or `'unsafe-eval'` as a convenience fix.

Do not add `data:` or `blob:` to a CSP directive unless a concrete feature requires it and the security effect is understood.

When a feature conflicts with CSP, first redesign the feature to work within the existing policy.

Keep the referrer policy at `no-referrer` unless an explicit privacy/security decision changes it.

## JavaScript and DOM safety

Use safe DOM APIs by default.

For dynamic text, prefer `textContent` or equivalent safe property assignment.

Do not introduce:

- `eval`;
- `new Function`;
- `document.write`;
- `innerHTML`;
- `outerHTML`;
- `insertAdjacentHTML`;
- inline event-handler attributes;
- `javascript:` URLs;
- script creation from untrusted strings;
- HTML parsing from query parameters, URL fragments, storage, or other untrusted data without a separately reviewed design.

Treat URL parameters, fragments, local storage, copied text, future imported data, and external content as untrusted input.

Do not construct navigation or resource URLs from untrusted input without explicit validation.

Keep JavaScript small and purpose-specific. Do not add a framework or client-side runtime merely for convenience when the existing static/vanilla implementation remains practical.

## Third-party resources and dependencies

Prefer locally stored, repository-controlled assets.

Do not introduce remote runtime dependencies by default, including:

- CDN-hosted JavaScript;
- remote stylesheets;
- Google Fonts or other remote fonts;
- analytics or tag-management scripts;
- advertising or tracking SDKs;
- externally hosted executable widgets;
- active third-party embeds;
- iframe-based content.

If a third-party runtime resource is genuinely necessary, it requires an explicit security and privacy review, the narrowest possible CSP change, and integrity protections where technically applicable.

Do not add npm or another package ecosystem solely to solve a small problem that can be implemented safely with the current dependency-light stack.

## Download and external-link integrity

Product download links are part of the site's security boundary.

Official downloads must point only to a verified first-party or official distribution location, such as:

- the corresponding repository or its GitHub Releases under the expected owner;
- an official application-store listing controlled by the product publisher;
- another explicitly approved official distribution endpoint.

Do not replace an official release or store link with:

- a file-sharing service;
- a mirror;
- a URL shortener;
- an unverified third-party download site;
- an attachment hosted under an unrelated account or repository.

Before changing a download destination, verify the expected owner, repository, product, release, or store listing.

Use HTTPS for external links.

For links opened with `target="_blank"`, preserve `noopener noreferrer` unless a concrete reviewed requirement justifies otherwise.

Do not silently redirect visitors through tracking or intermediary services.

When practical, prefer stable product or release pages over fragile temporary asset URLs.

## Product-information integrity

Public product information must be truthful and traceable to authoritative project information.

Never invent, infer, or extrapolate a product capability, version, platform, privacy property, security property, release status, download availability, adoption number, review, award, benchmark result, or other credibility signal.

Before changing factual product information, check the appropriate authoritative source, such as:

- the corresponding product repository;
- its current release/tag/changelog;
- its README or product documentation;
- an official store listing;
- another explicit source of truth for that product.

Pay particular attention before making claims such as:

- `offline`;
- `no tracking`;
- `no Internet permission`;
- `secure` or `encrypted`;
- `biometric`;
- a specific algorithm, framework, language, or architecture;
- supported OS versions or platforms;
- exact product versions;
- availability in a particular store;
- direct-download availability.

Public copy may be persuasive, but never at the expense of accuracy.

Marketing language must be grounded in actual product behavior or verifiable project information.

Do not use unsupported superlatives such as "best", "leading", "military-grade", "unbreakable", "guaranteed", or similar claims without strong, appropriate evidence.

When a release changes information shown on the portfolio, update all affected public surfaces consistently rather than leaving contradictory versions or statuses.

## Personal presentation and marketing quality

This site is intended to "sell" Stanley Lloyd professionally as well as promote his products.

When improving content or layout, optimize for a visitor being able to answer quickly:

- Who is this developer?
- What does he build?
- What is distinctive about his work?
- Which products can I use now?
- Which product should I explore next?
- Where can I verify or download it?

Use visual hierarchy and calls to action to make important products and differentiators easy to discover.

Do not hide the main developer/product story behind unnecessary navigation, implementation details, or decorative complexity.

Prefer specific, credible language over generic AI-style marketing phrases.

Do not add fake testimonials, fake social proof, fake user counts, fabricated quotes, artificial urgency, dark patterns, or misleading calls to action.

A call to action must accurately describe where it leads.

## Privacy and local browser state

The website should minimize data collection and remain free of tracking by default.

Do not introduce:

- analytics;
- advertising;
- behavioral tracking;
- fingerprinting;
- tracking pixels;
- third-party telemetry;
- hidden cross-site requests;
- cookies for tracking or profiling.

`localStorage` or equivalent local browser storage may be used only for non-sensitive presentation preferences or clearly local UX state, such as language or theme selection.

Do not store personal, authentication, payment, or other sensitive data in browser storage for this site.

Do not expand local storage into a parallel source of authoritative product information.

## Localization and language quality

The English and Russian versions are both first-class public product surfaces.

Changes to important user-facing content must review both language versions in the same work.

Keep both versions semantically synchronized for product features, release status, security/privacy claims, downloads, warnings, and other material facts.

### Russian version

The Russian version must use natural Russian as extensively as reasonably possible.

Translate navigation, headings, descriptions, labels, buttons, statuses, feature descriptions, explanatory text, accessibility labels, metadata, error messages, calls to action, and other user-facing copy into Russian.

Do not leave English wording in the Russian interface merely because the original text was written in English.

Keep untranslated only when translating would reduce clarity or sound artificial, including primarily:

- application and product names;
- trademarks and proper names;
- repository names and URLs;
- platform and technology names;
- established abbreviations;
- widely recognized technical terms normally used in English by Russian-speaking users.

Examples that normally remain unchanged include `Android`, `Windows`, `macOS`, `GitHub`, `Rust`, `Kotlin`, `SwiftUI`, `PWA`, `APK`, `AAB`, `API`, `UI/UX`, and similar established names or terms.

Where a natural, widely used Russian equivalent exists and is clearer for the intended audience, prefer Russian.

Avoid unnecessary English marketing words, headings, labels, category names, and status terms in the Russian version.

Do not mechanically translate product names, trademarks, code identifiers, technical identifiers, repository names, or established terminology.

Russian copy should read as if it were originally written by a fluent Russian speaker, not as a literal translation from English.

### English version

English copy should likewise read as natural English rather than as a literal translation of Russian text.

Do not preserve Russian syntax or idioms in English merely to maintain word-for-word parity.

### Localization parity

Semantic parity matters more than literal sentence-by-sentence equivalence.

If wording differs for naturalness, the visitor should still receive the same material facts, promises, warnings, and available actions.

## Assets and SVG safety

Treat SVG as an active-capable format rather than assuming it is always a harmless image.

Do not add scripts, event handlers, `javascript:` URLs, `foreignObject`, or unreviewed external references to SVG assets.

Prefer simple declarative SVG and repository-local raster assets.

Do not publish user-supplied or externally sourced SVG without reviewing it for active content and licensing/provenance.

Keep product artwork faithful to the corresponding product. Do not arbitrarily redraw or materially alter product identity assets while making unrelated site changes.

### Product artwork synchronization

Whenever a released product is synchronized with the portfolio, verify its current canonical icon or launcher artwork from the authoritative product repository or release in the same pass as versions, text, changelog and download links.

A product sync is incomplete until the artwork has been checked. If the authoritative artwork changed, update every affected public use consistently, including the main portfolio card, product page artwork, favicon where applicable, README tables and other product-specific surfaces.

Prefer the exact repository-local raster artwork. Technical resizing or format conversion is allowed only when required by the site and only when the visual content is unchanged. Do not redraw, trace, reinterpret, simplify or otherwise substitute an approximation for authoritative product artwork.

If the artwork did not change, explicitly verify that the published asset still matches the authoritative source rather than assuming it is current.

## Accessibility and UX

Accessibility is part of the public product quality of the site.

Preserve or improve:

- semantic HTML;
- correct document language;
- keyboard navigation;
- visible keyboard focus;
- skip navigation;
- meaningful link/button labels;
- appropriate ARIA only where native semantics are insufficient;
- useful image `alt` text;
- sufficient responsive behavior on mobile and desktop;
- readable text and contrast;
- reduced-motion preferences when motion is introduced;
- accessible controls for language and theme selection.

Do not replace semantic native elements with custom interactive elements without a concrete reason.

Do not make essential information dependent only on color, hover, animation, or pointer input.

## SEO and public identity

Preserve the canonical public identity of the site.

Keep canonical URLs, Open Graph metadata, descriptions, titles, and language-specific metadata consistent with the visible content.

Do not change the canonical host or public identity accidentally during refactoring.

Avoid duplicate or contradictory metadata.

The `404.html` page must remain safe and must not become an unreviewed redirect mechanism.

Do not introduce automatic external redirects without an explicit product and security reason.

## GitHub Actions and supply-chain security

Use least privilege for every workflow.

Default workflow permissions should remain read-only unless a job has a demonstrated need for a narrowly scoped write permission.

Third-party GitHub Actions must be pinned to immutable full commit SHAs.

Do not replace full-SHA pins with mutable tags or branches.

Do not use `pull_request_target` for code from untrusted pull requests.

Do not execute untrusted PR-controlled code in a privileged context.

Do not use broad `write-all` permissions.

Do not use `curl | sh`, `wget | sh`, or equivalent download-and-execute patterns.

Do not download and execute external tools without a pinned version and appropriate integrity/provenance controls.

Keep Dependabot coverage for GitHub Actions unless a reviewed replacement provides equivalent or stronger supply-chain maintenance.

Do not weaken CodeQL, static-security auditing, branch rules, secret scanning, push protection, or other existing repository safeguards to make a change pass.

## Secrets and credentials

The published site should not require runtime secrets.

If a proposed browser-side feature requires a secret, redesign the feature instead of embedding or exposing the secret.

Never commit or expose:

- GitHub PATs;
- application-store credentials;
- signing keys;
- private certificates;
- API secrets;
- cloud credentials;
- recovery codes;
- private vulnerability-report details.

Do not print secrets into workflow logs or include them in generated artifacts.

If a secret is discovered in history, treat removal from the current file as insufficient: rotate/revoke the credential and address repository history according to the relevant incident procedure.

## Source-code comments

Keep source-code comments minimal, necessary, current, and English-only.

Do not add comments that narrate obvious code.

Keep comments that explain a non-obvious security reason, compatibility constraint, browser quirk, accessibility requirement, or architectural decision.

Remove stale, misleading, redundant, or commented-out historical code when the surrounding change proves it is obsolete.

## Change and pull-request discipline

Use short-lived topic branches and pull requests. Do not use `main` as a working branch.

Keep changes focused on one coherent purpose.

Do not force-push protected/shared history, delete protected branches, bypass required checks, or weaken repository rules without explicit authorization.

A change is not complete until the required checks have succeeded.

Do not claim a check passed unless it actually ran successfully.

When a change affects public facts, security policy, privacy behavior, download locations, supported products, localization, or repository procedures, update the relevant README, SECURITY, product page, metadata, or other public documentation in the same work when necessary.

## Verification

Run the checks appropriate to the change before considering it complete.

The mandatory repository security check is:

```text
python3 scripts/security_audit.py
```

Preserve and satisfy the repository's required GitHub checks, including the dedicated static security audit and CodeQL requirements.

For site-content changes, also verify as applicable:

- all changed internal links and local assets resolve;
- changed external links use HTTPS and point to the intended destination;
- changed product/download links point to an authoritative official location;
- released-product icon and artwork match the authoritative project source across all public uses;
- EN/RU content remains semantically synchronized;
- Russian copy is maximally and naturally localized according to this file;
- responsive layout remains usable;
- keyboard navigation and focus behavior remain usable;
- HTML semantics and accessibility are not regressed;
- CSP and referrer protections remain present on affected HTML pages;
- no remote executable resource or active embed was introduced;
- no secret or unintended private file was added.

Security-related changes should prefer adding a regression check to `scripts/security_audit.py` when the invariant can be enforced reliably and without excessive false positives.

## Repository-wide audit and refactoring

For a repository-wide cleanup, optimization, simplification, or deep refactor, inspect the complete published surface before editing rather than only recently changed files.

Preserve all higher-priority rules in this file throughout the refactor.

The goal is minimum necessary complexity, not minimum line count.

Do not remove a security boundary, localization behavior, accessibility feature, product claim, public route, metadata contract, download path, or other externally observable behavior unless the task explicitly requires it and the effect has been verified.

Prove code or assets are unused before deleting them. Consider HTML references, CSS selectors, JavaScript hooks, metadata, product pages, `404.html`, `.well-known`, GitHub workflows, security tooling, README content, and direct public URLs.

Prefer deleting proven dead code, consolidating real duplication, simplifying unnecessary state, and reducing dependency surface while preserving the site's marketing purpose, trustworthiness, security posture, and public behavior.

## Final principle

The site should remain a secure, trustworthy, privacy-respecting, accessible, bilingual public presentation of Stanley Lloyd and his software.

Every change should strengthen or preserve the visitor's confidence that the person, product information, downloads, and security promises presented here are genuine.