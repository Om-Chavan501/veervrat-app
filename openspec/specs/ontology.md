# Ontology — Specification

## What it does
Provides read-only access to the static knowledge structure of the platform.
The ontology defines the hierarchy: **Virtue → SubVirtue → Sentence**, and the
orthogonal dimension of **Lacuna** (character gap) which maps to SubVirtues via priority.

All ontology data is seeded; end-users cannot create or modify it.
All endpoints require authentication.

---

## Domain Model

```
Virtue
  └─ SubVirtue (many per Virtue)
       └─ Sentence (many per SubVirtue)  ← the atomic unit of growth work

Lacuna (character gap, categorised A/B/C)
  └─ LacunaSubVirtue (ordered by priority) ← which sub-virtues address this gap
```

---

## API Contract

### GET `/api/v1/ontology/lacunae`
Returns all lacunae, ordered by category then name.

**Response** `200 List[LacunaOut]`
```json
[{ "id": "uuid", "name_en": "string", "name_mr": "string", "category": "A|B|C" }]
```

---

### GET `/api/v1/ontology/lacunae/{lacuna_id}`
Returns a single lacuna with its ordered sub-virtue list.

**Response** `200 LacunaDetailOut`
```json
{
  "id": "uuid",
  "name_en": "string",
  "name_mr": "string",
  "category": "A|B|C",
  "lacuna_sub_virtues": [
    {
      "id": "uuid",
      "lacuna_id": "uuid",
      "sub_virtue_id": "uuid",
      "priority": 1,
      "sub_virtue": { "id": "...", "name_en": "...", "name_mr": "...", "virtue_id": "...", "virtue": {...}, "sentences": [...] }
    }
  ]
}
```

**Errors**
- `404` — lacuna not found

---

### GET `/api/v1/ontology/virtues`
Returns all virtues, ordered alphabetically.

**Response** `200 List[VirtueOut]`
```json
[{ "id": "uuid", "name_en": "string", "name_mr": "string" }]
```

---

### GET `/api/v1/ontology/virtues/{virtue_id}/sub-virtues`
Returns sub-virtues for a specific virtue.

**Response** `200 List[SubVirtueOut]`
```json
[{ "id": "uuid", "name_en": "...", "name_mr": "...", "virtue_id": "uuid", "virtue": {...}, "sentences": [...] }]
```

---

### GET `/api/v1/ontology/sentences`
Returns all sentences, optionally filtered by `sub_virtue_id` query param.

**Query params**
- `sub_virtue_id` (optional) — filter to a specific sub-virtue

**Response** `200 List[SentenceOut]`
```json
[{ "id": "uuid", "text_en": "string", "text_mr": "string", "sub_virtue_id": "uuid" }]
```

---

## Acceptance Criteria

### Lacunae list
```
GIVEN an authenticated user
WHEN GET /ontology/lacunae is called
THEN all lacunae are returned sorted by category (A, B, C) then by name_en

GIVEN an unauthenticated request
WHEN GET /ontology/lacunae is called
THEN a 401 error is returned
```

### Lacuna detail
```
GIVEN a valid lacuna_id
WHEN GET /ontology/lacunae/{lacuna_id} is called
THEN the lacuna is returned with lacuna_sub_virtues ordered by priority ascending,
     each sub_virtue including its sentences and parent virtue

GIVEN an invalid lacuna_id
WHEN GET /ontology/lacunae/{lacuna_id} is called
THEN a 404 error is returned
```

### Virtues and sub-virtues
```
GIVEN an authenticated user
WHEN GET /ontology/virtues is called
THEN all virtues are returned in alphabetical order by name_en

GIVEN a valid virtue_id
WHEN GET /ontology/virtues/{virtue_id}/sub-virtues is called
THEN all sub-virtues belonging to that virtue are returned
```

### Sentences
```
GIVEN no query params
WHEN GET /ontology/sentences is called
THEN all sentences are returned

GIVEN sub_virtue_id query param
WHEN GET /ontology/sentences?sub_virtue_id=X is called
THEN only sentences belonging to that sub-virtue are returned
```
