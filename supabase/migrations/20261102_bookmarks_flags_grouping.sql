-- ============================================================================
-- Bookmarks: store subject/topic at save time so My bookmarks groups by
-- subject and topic. Run AFTER 20261102_bookmarks_flags.sql. Idempotent.
--
-- Display resolution order in the app (no migration needed for it):
--   1) the question's own module via the baked syllabus data (live truth,
--      survives admin reassigns) — this already fixes bookmarks saved
--      before this file, as long as the question has a module;
--   2) subject_name / topic_name stored here (covers module-less rows);
--   3) 'Question bank' fallback.
-- ============================================================================

alter table public.user_bookmarks
  add column if not exists subject_name text,
  add column if not exists topic_name text;
