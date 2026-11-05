-- Applied as migration realtor_relationships_next_action_optional.
-- Additive change: no existing Realtor relationship records are rewritten or deleted.
ALTER TABLE public.realtor_relationships
  ADD COLUMN IF NOT EXISTS next_action text NOT NULL DEFAULT '';
