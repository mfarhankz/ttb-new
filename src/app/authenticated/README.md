# Authenticated app areas

Each folder here maps to a **sidebar section** or shared domain module for logged-in users. Start here when working on a product area.

## Sidebar → folder

| Sidebar item | Folder | Route(s) |
|--------------|--------|----------|
| Dashboard | [`dashboard/`](dashboard/) | `/dashboard` |
| Property Search | [`property-search/`](property-search/) | Modal (no page route; opens from layout) |
| Farming | [`farming/`](farming/) | `/farming/*` |
| Statistics | [`statistics/`](statistics/) | `/statistics/*` |
| Buyer Cost Estimate | [`buyer-cost-estimate/`](buyer-cost-estimate/) | `/buyer-cost-estimate` |
| Property Lead Alerts | [`property-lead-alerts/`](property-lead-alerts/) | `/property-lead-alerts` |
| Admin (dashboard section) | [`admin/`](admin/) | `/admin/*`, `/manage-reports/*` |
| Login / MFA (modal) | [`auth/`](auth/) | `/login` lives in [`public/`](../public/) |

## Shared technical modules

These support multiple sidebar areas — not listed in the nav directly:

| Module | Used by |
|--------|---------|
| [`map/`](map/) | Farming + Statistics radius/boundary search (`map-search` page) |
| [`payment/`](payment/) | Pay Now modal, billing, wallet UI |
| [`net-sheet/`](net-sheet/) | Saved net sheets, buyer cost estimate |
| [`detail/`](detail/) | `/detail/:source/:sourceId` (farm, query, search results) |

## Typical domain layout

```
authenticated/<name>/
├── pages/           # route-level smart components
├── components/      # domain-only UI (optional)
├── services/        # API + state (optional)
├── config/          # tables, toolbars (optional)
├── interfaces/      # types (optional)
└── <name>.routes.ts # lazy route definitions
```

## Public vs authenticated

- **Before login:** [`../public/`](../public/) — home, login, MFA
- **After login:** this folder — all sidebar domains as siblings
