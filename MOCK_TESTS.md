
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
  (Q:/A:/B:/C:/D:/E:/Answer:/Explanation:/Subject:, blocks split by `---`).
  Preview before importing.
- **Fill from bank:** snapshot N random bank questions into the test (for the
  weekly cadence).

External questions work because `mock_test_questions` is a standalone snapshot
table — tests never need the `questions` bank.

### Setup

1. Run `supabase/migrations/20261014_mock_admin.sql` in the SQL editor
   (after the first mock-tests migration).
2. Deploy the branch. No new secrets or env vars needed.
