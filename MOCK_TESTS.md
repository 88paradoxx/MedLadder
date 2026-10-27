
## Admin panel (/admin-mock)

Branch: `feature/mock-admin-panel`

The admin panel lets you create tests and add external questions without SQL.
Open `https://medladder.top/admin-mock` (not linked anywhere; requires sign-in
with an admin account — `app_metadata.role = 'admin'`, see `grant-admin.sql`).

- **Tests tab:** lists all tests (draft/published/archived) with question and
  submission counts. Create, edit, publish, archive, delete.
- **Question editor:** add questions one by one (text, options A–E, answer,
  explanation, subject), edit or delete existing ones.
- **Bulk paste:** drop many questions at once using the documented block format
  (Q:/A:/B:/C:/D:/E:/Answer:/Explanation:/Subject:/Topic:, blocks split by `---`).
  Preview before importing. Batch subject/topic defaults above the box fill
  blocks that omit Subject:/Topic:; a block's own labels win. Topic names
  resolve against the syllabus (within the block's subject when given, else
  globally when unique) and are stored as the snapshot's topic. Every valid
  question goes to the mock; questions with a resolved topic, options C + D
  and an explanation ALSO go to the question bank, live immediately. Failed
  blocks never stop the batch — they are put back in the box for fixing.
- **Fill from bank:** snapshot N random bank questions into the test (for the
  weekly cadence).
- **Question bank authoring (Question bank tab):** pick a subject, then a
  topic (sliding subject/topic menu, same data as the main site), and add
  questions one by one (text, options A–E, answer, explanation). Questions
  go live in the bank immediately — no review queue — and the form stays on
  the same topic for rapid entry. The tab also has a bulk paste box: same
  block format as the editor (Q:/A:/B:/C:/D:/E:/Answer:/Explanation:/Subject:/
  Topic:, blocks split by `---`), bank-only writes, with the picked topic as
  the default for blocks that omit Subject:/Topic:. Only blocks with a
  resolved topic, options C + D and an explanation are imported; the rest
  are listed as skipped.
- **Fill from subjects (test editor):** pick a subject, tick topics, enter a
  count, and Draw snapshots that many random questions from just those
  topics into the test. New tests start as draft; publish with the existing
  status controls.

External questions work because `mock_test_questions` is a standalone snapshot
table — tests never need the `questions` bank.

### Post-window practice + frozen leaderboard

A published test stays startable after its window ends. Attempts started
after `ends_at` run as unranked practice: full-duration timer, graded and
stored like any attempt, but never ranked — the leaderboard shows only
attempts started at or before `ends_at`, and stays visible after the window
as the final frozen board. Practice attempts are labeled "Practice mode —
not ranked" in the lobby, the test header, and the result view, and show as
"Practice" in past results. In-window behavior is unchanged (deadline
capped at `ends_at`, live leaderboard, one attempt per user).

### Setup

1. Run `supabase/migrations/20261014_mock_admin.sql` in the SQL editor
   (after the first mock-tests migration).
2. Run `supabase/migrations/20261028_subject_mock_bank.sql` in the SQL
   editor (after the earlier mock migrations). It also adds a nullable
   `module_id` column to `mock_test_questions` so snapshots remember each
   question's topic. The user applies migrations himself — this PR never
   touches the live database.
3. Deploy the branch. No new secrets or env vars needed.
