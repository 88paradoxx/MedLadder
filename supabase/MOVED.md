# Moved

The Supabase server code (edge functions, SQL migrations, config) and its deploy
workflow now live in **88paradoxx/MedLadder-pages**, under `supabase/` and
`.github/workflows/deploy-functions.yml`.

Make server changes there. Merging to MedLadder-pages `main` deploys the functions
to the madlaader project automatically.

The website files in this repo are an old copy; the live site and the Android app
are also built from MedLadder-pages.
