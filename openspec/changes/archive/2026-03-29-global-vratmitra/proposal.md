## Why

Today, inviting a Vratmitra requires knowing the invitee's email and typing it manually — one journey at a time. There is no concept of a "global" Vratmitra relationship, so users who want the same trusted mentor across all their journeys must re-invite them individually each time. This creates friction and loses the intent of a sustained mentoring relationship.

## What Changes

- **User search endpoint**: New API to search registered users by name or email, returning paginated results for use in a typeahead/dropdown UI.
- **Global Vratmitra relationship**: A user can designate one other user as their global Vratmitra (a persistent, cross-journey mentoring relationship stored at the user level).
- **Global Vratmitra management UI**: In the Vratmitra page, a search-as-you-type input (debounced, dropdown results showing name + email) replaces the plain email field for inviting a global Vratmitra.
- **Journey Vratmitra default flow**: When a journey has no Vratmitra and the user has a global Vratmitra, the journey's Vratmitra tab prompts: "Continue with `{Global Vratmitra Name}` as Vratmitra for this journey?" with Accept / Choose different options.
- **Modified Capabilities**: The existing Vratmitra invitation model is extended — journey-level Vratmitra assignment now has a "use global" shortcut path in addition to the existing search-and-invite path.

## Capabilities

### New Capabilities

- `user-search`: Search registered users by name or email; returns paginated name + email results; used by the global Vratmitra picker and any future people-picker UI.
- `global-vratmitra`: Designating, viewing, and removing a global Vratmitra at the user level; the global relationship is separate from journey-level JourneyVratmitra records.

### Modified Capabilities

- `vratmitra`: Journey Vratmitra tab gains a "use global Vratmitra" prompt when a global relationship exists and no journey-level Vratmitra is set; the existing invite-by-email field is replaced by the user-search picker.

## Impact

- **Backend**: New `UserVratmitra` model (or column on `User`) for global relationship; new `GET /users/search` endpoint; `GET /vratmitra/global` + `POST /vratmitra/global` + `DELETE /vratmitra/global` endpoints.
- **Frontend**: New `UserSearchCombobox` component (debounced input + dropdown); updated `Vratmitra` page for global relationship management; updated `JourneyDetail` Vratmitra tab for the "use global" prompt flow.
- **API client**: New `usersApi.search(q)` function; new `invitesApi` entries for global Vratmitra CRUD.
- **i18n**: New translation keys for global Vratmitra UI, search states, and the journey-level prompt.
- **No breaking changes** to existing journey-level Vratmitra endpoints or acceptance flow.
