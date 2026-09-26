#!/usr/bin/env node
// Prints the SQL that seeds public.free_modules from syllabus.js.
// A module is "free" when it is one of the first FREE_MODULES_PER_SUBJECT
// modules of its subject — the same rule the client uses (PRO_CONFIG in app.js).
//
//   node tools/gen-free-modules.js        # default 8 per subject
//   node tools/gen-free-modules.js 10     # e.g. if you change the free tier to 10
//
// Paste the output over the free_modules seed block in supabase/schema.sql
// (or run it on its own in the Supabase SQL editor).
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'syllabus.js'));
const perSubject = parseInt(process.argv[2] || '8', 10);
const ids = [];
window.SYLLABUS_DATA.forEach(function (s) {
  s.modules.slice(0, perSubject).forEach(function (m) { ids.push(m.id); });
});
const rows = [];
for (let i = 0; i < ids.length; i += 10) {
  rows.push('  ' + ids.slice(i, i + 10).map(function (x) { return '(' + x + ')'; }).join(', '));
}
console.log('-- ' + ids.length + ' free modules (' + perSubject + ' per subject, generated from syllabus.js)');
console.log('delete from public.free_modules;');
console.log('insert into public.free_modules (module_id) values');
console.log(rows.join(',\n') + ';');
