# Toolbox AI — Feature-branch setup

This phase adds an optional, nonintrusive floating assistant on authenticated pages.
It is catalog-aware and offers four coaching modes. It cannot yet read/write
Originator Engine or Realtor Prospecting Engine data. That requires verified,
per-user engine APIs and explicit confirmation for mutations.

## Deployment setup
1. Run `supabase/ai-assistant.sql` in the hub's Supabase project.
2. Generate a random 32-byte key, hex encoded (e.g. `openssl rand -hex 32`).
3. Add `TOOLBOX_AI_ENCRYPTION_KEY` as a **server-only** Vercel environment variable.
   Keep the same secret across deployments and backups; rotation requires re-encrypting keys.
4. Deploy feature branch as preview and test with a disposable OpenAI API key.
5. API accounts need their own credit/billing; ChatGPT subscriptions do not cover API billing.

## Security and scope
- User OpenAI keys are AES-256-GCM encrypted before storing in Supabase.
- Keys are decrypted only in authenticated server API calls.
- Never store OpenAI keys in localStorage or expose them in API responses.
- Current conversation lives in browser state only; not persisted.
- Catalog descriptions are untrusted context; AI does not execute catalog URLs.
- External paid tools can be recommended, never accessed.
- AI must not claim writes to Originator/Realtor engines before integration.
- Future writes: user-scoped API adapters, explicit confirmation, idempotency,
  audit trail, and no service-role DB access for generic AI instructions.

## Subsequent development
- Add engine-specific read adapters and reliable metric definitions.
- Add activity logging action preview/confirmation and server-side validation.
- Add Realtor classification transitions and prospect discovery with verified sources.
- Add chat history, durable coaching memory, and connection settings within existing Settings UX.
- Add request quotas and abuse prevention for production deployment.
