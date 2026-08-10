# Security Policy

## Supported Versions

Security fixes are applied to the **latest release** and, where feasible, backported one minor version.

| Version | Supported |
|---------|-----------|
| Latest release | ✅ |
| Previous minor | ✅ (critical fixes only) |
| Older releases | ❌ |

If you are running a self-hosted instance, we strongly recommend staying on the latest release.

---

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.** Doing so exposes all users before a fix is available.

### Preferred method — GitHub Private Reporting

Use GitHub's built-in [private security advisory](https://github.com/wearegravitylabs/silo/security/advisories/new) feature. This is the fastest path to a fix.

### Alternative — Email

Send a detailed report to **security@gravitylabs.io**.

Encrypt sensitive reports with our PGP key (available on [keys.openpgp.org](https://keys.openpgp.org) — search `security@gravitylabs.io`).

### What to include

A useful report contains:

- A clear description of the vulnerability and its potential impact.
- Steps to reproduce, or a proof-of-concept (PoC). Screenshots and HTTP request/response logs are helpful.
- The affected component(s) and version(s) — API, frontend, a specific endpoint, a migration, etc.
- Any suggested mitigations or patches, if you have them.

---

## Response Timeline

| Milestone | Target |
|-----------|--------|
| Acknowledgement | Within 2 business days |
| Triage & severity assessment | Within 5 business days |
| Fix or mitigation guidance | Depends on severity (see below) |
| Public disclosure | After a fix is available |

### Severity targets

| CVSS | Severity | Target fix time |
|------|----------|----------------|
| 9.0–10.0 | Critical | 7 days |
| 7.0–8.9 | High | 14 days |
| 4.0–6.9 | Medium | 30 days |
| 0.1–3.9 | Low | Next release |

We will keep you informed of progress throughout the process and credit you in the advisory unless you prefer to remain anonymous.

---

## Scope

Reports are most valuable for vulnerabilities in:

- Authentication and session management (`POST /auth/*`)
- Authorisation bypasses (accessing another user's portfolio or data)
- Injection attacks (SQL injection, SSRF, command injection)
- Sensitive data exposure (encryption key handling, Vault decryption, presigned URL generation)
- Dependency vulnerabilities with a clear exploitation path in Silo

### Out of scope

- Vulnerabilities in self-hosted infrastructure that the user controls (e.g., exposing the admin port publicly)
- Issues already known and tracked in public issues
- Denial-of-service via resource exhaustion without a specific exploit
- Missing security headers on the demo instance
- Issues in third-party services (Yahoo Finance, CoinGecko, Resend) — report those upstream

---

## Disclosure Policy

We follow **coordinated disclosure**: fixes are prepared privately, a CVE is requested if warranted, and the advisory is published once a patched release is available. We ask that reporters allow at least 90 days before public disclosure, though we aim to resolve issues far sooner.
