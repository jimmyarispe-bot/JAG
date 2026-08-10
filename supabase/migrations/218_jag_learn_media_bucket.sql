-- JAG Learning Center instructional media (Phase 2A)
-- Private bucket for Mr. Jag tutorial MP4s.
--
-- Access model:
--   - Bucket is private (public = false).
--   - No authenticated storage.objects policies that grant broad SELECT.
--   - Runtime playback uses short-lived signed URLs minted server-side
--     (service role) after JAG Learning Center authorization
--     (canAccessJagLearningCenter / canAccessTutorial).
--
-- Object path contract:
--   tutorials/JAG-001/mr-jag.mp4 … tutorials/JAG-010/mr-jag.mp4

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jag-learn-media',
  'jag-learn-media',
  false,
  209715200, -- 200 MiB
  array['video/mp4']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Explicitly drop any accidental open policies if re-applied.
drop policy if exists jag_learn_media_authenticated_all on storage.objects;
drop policy if exists jag_learn_media_authenticated_select on storage.objects;
drop policy if exists jag_learn_media_public_select on storage.objects;

-- No authenticated/anon SELECT/INSERT/UPDATE/DELETE policies on this bucket.
-- Service role (used only by server ingest + signed-URL minting) bypasses RLS.
-- End users receive playback URLs only through the authorized Learning media layer.
