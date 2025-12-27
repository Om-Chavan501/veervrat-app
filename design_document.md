# VEERVRAT

## Design Document — Framework, Ontology, and User Journeys (MVP)

---

## 1. Purpose of the Application

Veervrat is a **self-transformation system** designed to help youth overcome internal weaknesses (“Lacunae”) through **structured self-awareness, disciplined inner work, and real-world application**, supported by philosophy, reflection, and accountability.

The application digitizes an existing offline framework and **preserves its rigor**, not simplifies it into habit-tracking or motivation tooling.

The goal is not productivity or optimization, but **inner self-reliance, courage, clarity, and sustained character development**.

---

## 2. Core Philosophy (Conceptual Foundation)

Veervrat operates on the belief that:

* Most youth suffer not from lack of intelligence or ambition, but from:

  * low self-awareness
  * lack of internal discipline
  * avoidance of discomfort
  * short-term thinking
  * fragmented identity

* True growth requires:

  * conscious identification of internal lacunae
  * deliberate cultivation of virtues
  * reflection grounded in lived experience
  * sustained practice with accountability

Veervrat is not about fixing behavior directly.
It is about **changing the inner orientation from which behavior arises**.

---

## 3. Key Concepts & Ontology

These concepts are **non-negotiable** and must be modeled faithfully.

### 3.1 Lacuna (Weakness)

A **lacuna** is a neutral, non-moralized internal gap or weakness (e.g., fear of failure, indecisiveness, lack of confidence).

* Lacunae are **static ontology** (predefined, curated).
* A user can engage with the same lacuna multiple times across life.

---

### 3.2 Virtue & SubVirtue

* **Virtues** are high-level character qualities (e.g., Self-Reliance).
* **SubVirtues** are concrete, trainable facets of a virtue (e.g., Intellectual Self-Reliance).

Each SubVirtue:

* Belongs to exactly one Virtue
* Is used to counteract one or more Lacunae

---

### 3.3 Sentence (Behavioral Indicator)

A **Sentence** is a concrete, first-person statement that expresses the **presence of a SubVirtue in action**.

Example:

> “I form my opinion by considering others’ views and then independently constructing my own.”

Sentences are:

* Used for self-assessment (tests)
* The atomic unit of inner work
* The anchor for all practice, reflection, and challenges

The system is **sentence-centric**, not lacuna-centric.

---

## 4. The Veervrat Framework (High-Level Flow)

The framework operates as a **deliberate, staged process**:

1. Identify a Lacuna
2. Perform a self-assessment (test)
3. Reflect on results and choose a Sentence
4. Deeply clarify the meaning of that Sentence in context
5. Commit to practice via resolutions
6. Apply consciously in daily life
7. Reflect regularly
8. Pause, resume, or complete consciously

This flow is **repeatable**, **non-linear**, and **historically traceable**.

---

## 5. User Roles (MVP)

### 5.1 Vratarthi (Primary User)

The Vratarthi is the sole authenticated user in MVP.

They can:

* Perform assessments
* Choose sentences
* Undertake sentence journeys
* Write clarifications
* Set resolutions
* Log reflections
* Pause or complete journeys

### 5.2 Vratmitra (Mentor)

In MVP:

* Exists **outside the system**
* Influence is reflected through user-entered clarification and decisions
* No separate login or role yet

---

## 6. Core User Journeys

### 6.1 Entry & Orientation

Upon login, the user is shown:

* Active sentence journeys
* Any in-progress assessment
* Option to start a new assessment

There are **no public or anonymous flows**.

---

### 6.2 Lacuna Selection

The user selects a lacuna to work on:

* From previously shortlisted lacunae
* Or from the full lacuna list

This selection immediately leads to an assessment.

---

### 6.3 Lacuna Assessment (Test)

The assessment:

* Is grouped by SubVirtues relevant to the lacuna
* Presents Sentences under each SubVirtue
* Requires the user to rate each sentence as:

  * Always / Often / Rarely / Never

Important principles:

* Ratings are about **actual behavior**, not capability
* Assessments are **resumable**
* Only one in-progress assessment per lacuna is allowed

Once completed:

* The assessment becomes immutable
* Suggestions are generated

---

### 6.4 Assessment Results & Suggestions

After completion, the user sees:

* Suggested sentences (based on low ratings)
* Ordered by lacuna relevance
* All other sentences as optional choices
* Indicators showing:

  * Active journeys
  * Inactive journeys
  * Completed journeys

The user must **consciously select one sentence** to work on.

---

## 7. Sentence Journey (Core Unit of Transformation)

A **Sentence Journey** represents sustained inner work on one sentence.

Key properties:

* One journey per (user × sentence)
* A journey may be relevant to multiple lacunae
* Journeys are never deleted

### Possible states:

* ACTIVE
* INACTIVE (paused)
* COMPLETED

---

### 7.1 Starting or Linking a Journey

When a sentence is selected:

* If no journey exists → create a new journey
* If ACTIVE journey exists → offer to link new lacuna context
* If INACTIVE journey exists → offer to resume or start fresh

Every lacuna context **requires its own clarification**.

---

## 8. Clarification (Cognitive Gate)

Clarification is **mandatory** and non-skippable.

For each (Sentence × Lacuna) context, the user must articulate:

1. How this sentence relates to the associated SubVirtue
2. How strengthening the SubVirtue will reduce this Lacuna
3. A unified insight combining points 1 & 2
4. A personal incident where the Lacuna manifested, and its link to one of Ellis’s three irrational beliefs:

   * Must be loved
   * Must be competent
   * Must have comfort

Clarification:

* Can be refined over time
* Is required before any practice begins

---

## 9. Resolution (Commitment to Action)

A **Resolution** is a concrete commitment to apply the sentence.

Characteristics:

* Defined by the user
* Practical and observable
* Can specify frequency or conditions

Resolutions:

* Are mutable
* Exist only while journey is ACTIVE
* Are guidance, not enforcement

---

## 10. Daily Reflection (Practice Loop)

Reflection is the **core reinforcement mechanism**.

For each active journey, the user can log **one reflection per day**, answering:

* Did I apply the sentence today?
* In what context?
* What insight did I gain?
* What difficulty did I face? (optional)

Rules:

* One reflection per day
* Editable same day
* Locked afterward

Reflection is **not streak-based**; insight matters more than consistency.

---

## 11. State Machines (Behavioral Guarantees)

### 11.1 Assessment

* IN_PROGRESS → COMPLETED
* Completed assessments are immutable

### 11.2 Sentence Journey

* ACTIVE ↔ INACTIVE → COMPLETED
* Cannot complete directly from INACTIVE
* Completed journeys are final

### 11.3 Reflection

* Created → Locked (by date)

Illegal states must never occur (e.g., reflection without active journey).

---

## 12. Permissions & Guardrails

* All data is private to the user
* Ontology is read-only
* No journey without completed assessment
* No resolution without clarification
* No reflection without active journey
* No edits to completed assessments

Security is ownership-based, not role-based.

---

## 13. What the MVP Explicitly Does NOT Do

* No AI coaching
* No gamification
* No streak pressure
* No social feeds
* No leaderboards
* No notifications (initially)
* No automation of insight

The system **supports thinking**, it does not replace it.

---

## 14. Design Intent for Implementers (IMPORTANT)

The app must feel:

* Calm, serious, and reflective
* Non-judgmental
* Slow by design
* Resistant to impulsive action

Every action should feel **intentional**, not reactive.

---

## 15. Final Note to Implementers (for Copilot)

> This system is not a CRUD app.
> It is a **cognitive framework encoded in software**.
> Preserve historical truth.
> Enforce conscious transitions.
> Never auto-complete inner work.
