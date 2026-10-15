# Website CMS (Supabase)

- **Editor:** `/admin` — email + password login (users are created in Supabase → Authentication → Users).
- **How it works:** pages keep their built-in text. `js/cms.js` fetches the clinic's edits from the
  Supabase table `site_content` and applies them (`data-cms="key"` texts, `data-clinic` contact details,
  the scrolling notice, and the Services list/pop-ups). If Supabase is down, the built-in text shows.
- **Database setup:** run `supabase/setup.sql` once in the Supabase SQL editor.
- **Settings:** `js/cms-config.js` (project URL + public anon key — safe to be public; row-level
  security only lets signed-in users write).
- **If you change page HTML by hand:** run `cd tools && npm install && node tag-cms.mjs` to tag any new
  text and refresh `admin/manifest.json`. Services defaults: `python3 tools/extract-services.py`.
- Gallery is parked in `_disabled/gallery/` (see its README to restore).
