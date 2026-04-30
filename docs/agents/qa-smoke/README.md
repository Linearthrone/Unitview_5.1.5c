# QA smoke harness

Run from `renderer/`:

```bash
npm run qa:smoke
```

What it validates (deterministic smoke):
1. app startup -> login screen appears
2. login with default nurse account
3. dashboard appears and can enter a unit
4. in-unit print menu opens (Charge report visible)
5. oncoming shift board opens/closes
6. basic drag signal on patient card dispatches

Artifacts:
- log file written to `docs/agents/reports/artifacts/qa-smoke-<timestamp>.log`
- Playwright failure screenshots/traces retained on failure under renderer test output

Notes:
- Harness runs headless Chromium via Playwright.
- Web server is auto-started by Playwright config on `http://127.0.0.1:4173`.
