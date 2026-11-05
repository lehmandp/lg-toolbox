# LG Loan Toolbox: native-module development contract

The shell (authentication, My Toolbox, Marketplace, profile, navigation) is shared. Native tools are independently owned modules.

## Boundaries
- Each tool owns its page under app/<module>, UI under components/<module>, and API routes under app/api/<module>.
- New tools must not change another tool's user records, storage keys, APIs, or schemas.
- Shared components must remain backward-compatible. Changing shared contracts requires testing each consumer.
- Toolbox AI is optional. No native tool may require an API key to read, create, or edit its own records.

## Persistent data
- User-generated business records belong in authenticated, user-scoped Supabase tables with RLS.
- Browser localStorage is only a cache or temporary draft store. Do not silently replace or delete old localStorage data during migrations.
- Before switching storage, export a backup, compare cloud and browser records, and require explicit confirmation for each import/reconciliation.
- Never bulk overwrite cloud records or auto-delete records on initial load.
- Keep schema migrations additive and backward compatible; test high-risk changes against staging data before applying to shared databases.

## Branch and release discipline
- Start one feature branch per module change from the current integration baseline.
- Preview deploy and validate the changed module plus login and existing-tool smoke tests.
- For a data migration, test rollback and audit the cloud record count before and after.
- Merge only after checks succeed. Production deploys are explicit, not implied by a READY preview.
- Avoid speculative cross-module refactors while resolving user-data safety problems.

## Outstanding release gates
- Reconcile existing Realtor Prospecting browser records and the realtor_relationships Supabase table (without overwrites).
- Use user/browser time zones in AI planning and weekly summaries; provide manual override later.
- Confirm post-update activity and Realtor records persist and can be used from another browser/device.
- Configure production-only AI encryption safely, preserving existing encrypted credentials or requiring reconnection.
- Add automated core smoke tests and continue hardening Supabase security advisories.
