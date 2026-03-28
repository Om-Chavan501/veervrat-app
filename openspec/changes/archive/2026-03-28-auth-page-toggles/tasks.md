# Tasks: auth-page-toggles

## Frontend

- [x] Add theme + language toggle row to `Login.tsx`:
  - Wrap the page root div in `relative`
  - Add `absolute top-4 right-4 flex gap-2` toggle row
  - Theme button: Sun/Moon icon, calls `toggleTheme()` from ThemeContext
  - Language button: Languages icon, toggles lang between mr/en from LanguageContext
  - Both buttons: small icon-only, subtle styling consistent with auth page

- [x] Add the same toggle row to `Register.tsx`
