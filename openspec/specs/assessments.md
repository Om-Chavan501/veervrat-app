# Lacuna Assessments — Specification

## What it does
A **LacunaAssessment** is a structured self-evaluation of all Sentences under a specific
Lacuna. The user rates each sentence (ALWAYS / OFTEN / RARELY / NEVER) to reveal which
sub-virtue areas they are weakest in.

On completion the system automatically generates **SuggestedSentenceSnapshots** — a ranked
list of sentences the user should work on (prioritised by Lacuna's sub-virtue priority map
and filtered to RARELY/NEVER ratings). These suggestions drive Journey creation.

---

## Domain Model

```
LacunaAssessment  (user + lacuna, status: IN_PROGRESS | COMPLETED)
  ├─ AssessmentResponse  (sentence_id + rating, unique per assessment+sentence)
  └─ SuggestedSentenceSnapshot  (priority_rank + reason, generated on complete)
```

A user can have at most one IN_PROGRESS assessment per lacuna at a time.
Re-starting for the same lacuna resumes the existing IN_PROGRESS assessment.
Completed assessments are immutable (responses cannot be changed).

---

## API Contract

### GET `/api/v1/assessments`
Returns all assessments for the current user, newest first.

**Query params**
- `skip` (default 0), `limit` (default 50, max 200)

**Response** `200 List[AssessmentOut]`
```json
[{ "id": "uuid", "user_id": "...", "lacuna_id": "...", "status": "IN_PROGRESS|COMPLETED",
   "started_at": "datetime", "completed_at": "datetime|null", "shortlist_session_id": "uuid|null",
   "lacuna": { "id": "...", "name_en": "...", "name_mr": "...", "category": "A|B|C" } }]
```

---

### POST `/api/v1/assessments/start`
Starts a new assessment for a lacuna, or resumes an existing IN_PROGRESS one.

**Request**
```json
{ "lacuna_id": "uuid", "shortlist_session_id": "uuid|null" }
```

**Response** `200 AssessmentDetailOut` — full detail with lacuna (incl. sub-virtues and sentences),
existing responses, and suggestions (empty until completed).

---

### GET `/api/v1/assessments/{assessment_id}`
Returns full assessment detail.

**Response** `200 AssessmentDetailOut`

**Errors**
- `404` — assessment not found
- `403` — belongs to another user

---

### POST `/api/v1/assessments/{assessment_id}/responses`
Saves or updates the rating for a sentence.

**Request**
```json
{ "sentence_id": "uuid", "rating": "ALWAYS|OFTEN|RARELY|NEVER" }
```

**Response** `200 { "success": true }`

**Errors**
- `400` — assessment already completed (immutable)
- `403` / `404` — access errors

---

### DELETE `/api/v1/assessments/{assessment_id}/responses/{sentence_id}`
Removes the rating for a sentence (allows un-answering).

**Response** `200 { "success": true }`

**Errors**
- `400` — assessment already completed

---

### POST `/api/v1/assessments/{assessment_id}/complete`
Marks the assessment as COMPLETED and triggers suggestion generation.

**Response** `200 AssessmentDetailOut` — includes generated suggestions

**Errors**
- `400` — assessment already completed

---

### GET `/api/v1/assessments/{assessment_id}/suggestions`
Returns the prioritised suggestions generated after completion.

**Response** `200 List[SuggestedSnapshotOut]`
```json
[{
  "id": "uuid",
  "assessment_id": "uuid",
  "sentence_id": "uuid",
  "priority_rank": 1,
  "reason": "Rated RARELY — needs cultivation of <sub_virtue_name>",
  "sentence": { ...SentenceDetailOut with sub_virtue and virtue... }
}]
```

---

## Suggestion Generation Algorithm

On `POST /{assessment_id}/complete`:
1. Collect all responses with rating `RARELY` or `NEVER`
2. For each response, look up the sub-virtue's priority in the lacuna's LacunaSubVirtue map
3. Sort by that priority (ascending; unknown sub-virtues go last)
4. Delete any previous suggestions for this assessment
5. Re-create with `priority_rank` = 1..N
6. `reason` = `"Rated <RATING> — needs cultivation of <sub_virtue.name_en>"`

---

## Acceptance Criteria

### Starting an assessment
```
GIVEN a lacuna with no existing IN_PROGRESS assessment
WHEN POST /assessments/start is called
THEN a new IN_PROGRESS assessment is created and returned with all lacuna sentences embedded

GIVEN a lacuna with an existing IN_PROGRESS assessment
WHEN POST /assessments/start is called again
THEN the existing assessment is returned (idempotent, not duplicated)
```

### Saving responses
```
GIVEN an IN_PROGRESS assessment and a valid sentence_id
WHEN POST /assessments/{id}/responses is called with a rating
THEN the response is saved; if already answered for that sentence it is overwritten

GIVEN a COMPLETED assessment
WHEN POST /assessments/{id}/responses is called
THEN a 400 error is returned
```

### Completing an assessment
```
GIVEN an IN_PROGRESS assessment (with or without responses)
WHEN POST /assessments/{id}/complete is called
THEN status becomes COMPLETED, completed_at is set, suggestions are generated

GIVEN sentences rated RARELY or NEVER
WHEN suggestions are generated
THEN they are ranked by the lacuna sub-virtue priority map ascending,
     and the reason field describes the rating and sub-virtue needing cultivation

GIVEN a COMPLETED assessment
WHEN POST /assessments/{id}/complete is called again
THEN a 400 error is returned
```

### Ownership
```
GIVEN an assessment belonging to user A
WHEN user B calls any endpoint for that assessment
THEN a 403 error is returned
```
