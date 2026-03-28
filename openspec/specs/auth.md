# Auth — Specification

## What it does
Handles user registration, login, JWT token lifecycle, and current-user profile access.
Tokens are short-lived access tokens + long-lived refresh tokens (Bearer scheme).
Auth state is stored client-side in Zustand (`src/store/authStore.ts`).

---

## API Contract

### POST `/api/v1/auth/register`
**Request**
```json
{ "name": "string", "email": "string", "password": "string (min 8)", "confirm_password": "string" }
```
**Response** `200 TokenResponse`
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": { "id": "uuid", "name": "string", "email": "string", "created_at": "datetime" }
}
```
**Errors**
- `400` — passwords do not match
- `400` — email already registered

---

### POST `/api/v1/auth/login`
**Request**
```json
{ "email": "string", "password": "string" }
```
**Response** `200 TokenResponse` (same shape as register)

**Errors**
- `401` — invalid email or password

---

### POST `/api/v1/auth/refresh`
**Request**
```json
{ "refresh_token": "string" }
```
**Response** `200 TokenResponse` — new access + refresh pair

**Errors**
- `401` — invalid or expired refresh token
- `401` — user no longer exists

---

### GET `/api/v1/auth/me`
Returns the currently authenticated user.

**Headers** `Authorization: Bearer <access_token>`

**Response** `200 UserOut`
```json
{ "id": "uuid", "name": "string", "email": "string", "created_at": "datetime" }
```

---

## Acceptance Criteria

### Registration
```
GIVEN a new email and valid password pair
WHEN POST /auth/register is called
THEN a 200 TokenResponse is returned with access_token, refresh_token, and user object

GIVEN an already-registered email
WHEN POST /auth/register is called
THEN a 400 error is returned with detail "Email already registered"

GIVEN mismatched password and confirm_password
WHEN POST /auth/register is called
THEN a 400 error is returned with detail "Passwords do not match"

GIVEN a password shorter than 8 characters
WHEN POST /auth/register is called
THEN a 422 validation error is returned
```

### Login
```
GIVEN valid credentials
WHEN POST /auth/login is called
THEN a 200 TokenResponse is returned

GIVEN an incorrect password or unknown email
WHEN POST /auth/login is called
THEN a 401 error is returned (same message regardless of which field was wrong)
```

### Token Refresh
```
GIVEN a valid refresh token
WHEN POST /auth/refresh is called
THEN a new TokenResponse pair is returned (old tokens are invalidated client-side)

GIVEN an expired or malformed refresh token
WHEN POST /auth/refresh is called
THEN a 401 error is returned
```

### Profile
```
GIVEN a valid access token
WHEN GET /auth/me is called
THEN the authenticated user's profile is returned

GIVEN no or invalid token
WHEN GET /auth/me is called
THEN a 401 error is returned
```
