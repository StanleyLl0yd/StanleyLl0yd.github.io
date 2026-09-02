# Security Policy

This repository publishes the static website at `https://stanleyll0yd.github.io/`.

## Reporting a vulnerability

Please do not publish exploit details, credentials, tokens, private keys, proof-of-concept payloads, or other sensitive material in a public issue.

Prefer GitHub's private vulnerability reporting / Security Advisory flow for this repository when it is available. If a private report option is not available, open only a minimal public issue stating that you need a private contact channel; do not include technical exploit details in that issue.

Reports that can affect the integrity of the published site, repository, release links, or GitHub Actions are treated as security issues.

## Repository rules

- Secrets and signing material must never be committed to this repository.
- GitHub Actions must use least privilege and third-party actions must be pinned to immutable full commit SHAs.
- The permanent CI security workflow is read-only.
- The site must not introduce remote scripts, remote stylesheets, active embeds, inline event handlers, or dangerous JavaScript HTML sinks without an explicit security review.
- Changes to the public site should go through pull requests and the security check before merge once branch protection is enabled.

## Scope

The website is static and does not provide authentication, payments, data submission, or a server-side application backend. Product download links may lead to GitHub Releases or application stores; vulnerabilities in an individual application should be reported in that application's repository when possible.
