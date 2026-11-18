# Data sources

## City of Calgary Open Data
Contains information licensed under the **Open Government Licence – City of Calgary**.
<https://data.calgary.ca> (see the portal's Terms of Use).

| Dataset | ID | Used for |
|---|---|---|
| Community District Boundaries | `surr-xmvs` | Community names, codes, class (residential only), sector |
| 2021 Federal Census Population and Dwellings by Community | `f9wk-wej9` | Population (`total_pop_household`) |
| Historical Community Populations | `jtpc-xgsh` | Population fallback: latest civic census year (2019) |

- Snapshot: `supabase/data/calgary_communities.csv` (223 residential communities, fetched 2026-11-18).
  17 brand-new communities have no census population (`null`).
- Rebuild: `python3 supabase/data/build_communities.py`, then
  `python3 supabase/data/build_communities.py --sql supabase/migrations/<new timestamp>_gamecore_communities_update.sql`
  (new rows only; existing codes are skipped by `on conflict do nothing`).
- Display names are generated from the official upper-case names (e.g. `MCKENZIE TOWNE` → `McKenzie Towne`);
  fixes go in `NAME_OVERRIDES` in the script.
- Boundary polygons (World Map M10, residency M7) come from the same `surr-xmvs` dataset later.
