# AegisRunner documentation

Customer documentation for https://docs.aegisrunner.com, hosted by Documentation.AI.

## Edit and validate

Use Node.js 22 or later:

```bash
npm ci
npm run check
```

The checker compiles every MDX page, parses frontmatter and JSON/YAML examples,
checks navigation and internal links, validates the site configuration against
Documentation.AI's schema, and validates the OpenAPI document.

The schema snapshot in `scripts/documentation.schema.json` was downloaded from
https://dashboard.documentation.ai/documentation.json on 2026-10-07. Refresh it
when adopting new platform configuration fields.

## Content ownership

- `documentation.json`: branding, canonical URL, navigation, and metadata.
- `guides/`: project setup, scanning, app access, tests, results, and mobile.
- `automation/`: CLI, CI, private targets, and schedules.
- `account/`: usage, subscription management, and invoices.
- `api-reference/`: project CI-token authentication, errors, and OpenAPI.
- `help-center/`: FAQs and troubleshooting.

Keep existing page paths stable. The old changelog path remains available as a
product-updates page; it does not repeat the starter template's unverified release
history. Use the real product name, URLs, and UI labels. Do not add guessed dates,
prices, limits, security certifications, or unsupported endpoints.

## Verify product behavior

The initial rewrite was checked against the AegisRunner application workspace on
2026-10-07. The working tree contains changes beyond its Git HEAD; a reviewer should
confirm that described UI flows match the deployed application before publication.
Useful source locations in the application repository:

| Area | Source |
| --- | --- |
| First scan and mobile upload | `web/app/pages/app/index.vue`, `web/app/components/NewUnifiedScanModal.vue` |
| Navigation and setup | `web/app/components/ProjectShell.vue`, `web/app/pages/app/[projectId]/manage.vue` |
| App login and cookies | `web/app/components/manage/Logins.vue`, `web/app/pages/app/[projectId]/access.vue` |
| Evidence and exports | `web/app/components/workspace/ReportPane.vue`, `web/app/components/workspace/RunDetail.vue` |
| Environments, schedules, integrations | `web/app/components/manage/` |
| Billing | `web/app/components/settings/Billing.vue` |
| CI HTTP contract | `backend/internal/handlers/ci_trigger.go`, `backend/internal/handlers/ci_events.go`, `backend/cmd/api/main.go` |
| CLI behavior | `cli/bin/aegis.mjs`, `cli/lib/` |

The old application `openapi-v1.yaml` contains placeholder hosts and older contracts;
it is not copied into the customer API reference. The published specification
covers the three implemented CI automation endpoints and their common fields.
Each endpoint has an explicit MDX page with a page-level OpenAPI connection in
`documentation.json`; the checker requires every published operation to appear
in navigation.

## Review and publish

Open a pull request to `main`. Documentation.AI can deploy the configured
publishing branch automatically, so merge only when the content is ready to go
live. The custom domain is configured in Documentation.AI; the canonical URL here
does not change DNS or account settings.

Local checks do not reproduce Documentation.AI's hosted renderer. Inspect the
platform's branch preview, including API navigation, tables, cards, logos, and
mobile layout, before merging. No Documentation.AI API key is needed to edit or
review this repository through GitHub.
