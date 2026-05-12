---
title: API Token Authentication Security Review and Fixes
date: 2026-05-12
category: security-issues
module: authentication
problem_type: security_issue
component: authentication
severity: high
symptoms:
  - CSRF vulnerability on token management endpoints via unprotected auth cookie
  - API token JWTs issued without expiration claim enabling permanent access if leaked
  - API-token-authenticated sessions could create and revoke other API tokens
  - DELETE endpoint accepted array query parameters risking multi-token deletion
  - Type confusion on token name input could trigger unhandled TypeError
root_cause: missing_validation
resolution_type: code_fix
tags:
  - api-token
  - jwt
  - csrf
  - authentication
  - session
  - authorization
  - nextjs
---

# API Token Authentication Security Review and Fixes

## Problem

Implementation of API token authentication for a CLI interface (U1 of the slackernews CLI plan) revealed multiple security vulnerabilities and type safety gaps. The initial implementation allowed cross-site request forgery against token management endpoints, issued JWTs without expiration, permitted privilege escalation via API tokens managing other tokens, and failed to validate input types before database operations.

## Symptoms

- **CSRF on POST/DELETE `/api/user/tokens`**: The `auth` cookie was set without `SameSite` or `Secure` flags, allowing any malicious site to trick an authenticated user into creating or revoking API tokens.
- **JWTs without expiration**: API token JWTs carried no `exp` claim, meaning a leaked token would remain cryptographically valid forever unless the database row was manually deleted.
- **Privilege escalation**: An attacker with a single API token could use it to create unlimited additional API tokens or revoke existing ones via `POST/DELETE /api/user/tokens`.
- **Array query parameter injection**: The DELETE handler read `req.query.id` without validating it was a single string. Next.js parses `?id=a&id=b` into an array, which Sequelize can interpret as an `IN` clause, potentially deleting multiple tokens.
- **Type confusion on token name**: The POST handler destructured `req.body.name` and called `.trim()` without checking `typeof name === 'string'`, exposing an unhandled `TypeError` path.
- **Sequelize undefined footgun**: Exported DB helpers accepted `undefined` values in `where` clauses. Sequelize ignores `undefined` in `where` filters, potentially matching all rows instead of none.

## What Didn't Work

- **Naive query parameter handling**: Using `const { id } = req.query` without type normalization. Next.js `req.query` values can be `string | string[]`, and passing an array to Sequelize's `where.id` produces an `IN (...)` query instead of an equality check.
- **Assuming JWT library defaults are safe**: `jsonwebtoken`'s `jwt.sign()` without `expiresIn` creates tokens that are valid indefinitely. The library does not warn about this.
- **Trusting cookie auth for state-changing API endpoints**: The `auth` cookie was set with only `httpOnly: true`, missing both `sameSite` and `secure` flags. This is a pre-existing vulnerability that the new token-management endpoint made more exploitable.

## Solution

### 1. Add `SameSite` and `Secure` to the auth cookie

In `pages/login/callback.js` and `pages/logout.js`:

```javascript
// Before
cookies.set('auth', token, {
  httpOnly: true,
});

// After
cookies.set('auth', token, {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
});
```

### 2. Add JWT expiration to API token JWTs

In `lib/session.ts`:

```typescript
// Before
const token = jwt.sign(claims, jwtSigningKey, { algorithm: 'HS256' });

// After
const token = jwt.sign(claims, jwtSigningKey, {
  algorithm: 'HS256',
  expiresIn: '365d',
});
```

### 3. Block API-token auth from managing other tokens

In `pages/api/user/tokens.ts`, reject `POST` and `DELETE` when the request is authenticated via `Authorization: Bearer` (API token), requiring a web session (cookie):

```typescript
const isApiTokenAuth = req.headers?.authorization?.startsWith('Bearer ');
if (isApiTokenAuth && req.method !== 'GET') {
  res.status(403).send({ error: 'Token management requires web session authentication' });
  return;
}
```

### 4. Validate and normalize query parameters

```typescript
// Before
const { id } = req.query;

// After
const id = typeof req.query.id === 'string'
  ? req.query.id
  : Array.isArray(req.query.id)
    ? req.query.id[0]
    : undefined;
```

### 5. Add type guards on all inputs

```typescript
// Before
const { name } = req.body;
if (!name || name.trim().length === 0) {

// After
const { name } = req.body;
if (typeof name !== 'string' || name.trim().length === 0) {
```

And in all DB helpers:

```typescript
export async function listApiTokens(userId: string): Promise<ApiToken[]> {
  if (!userId) {
    throw new Error('userId is required');
  }
  // ...
}

export async function deleteApiToken(tokenId: string, userId: string): Promise<boolean> {
  if (!tokenId || !userId) {
    return false;
  }
  // ...
}
```

### 6. Use strict JWT verification options

```typescript
// Before
const claims = jwt.verify(token, signingKey) as jwt.JwtPayload;

// After
const claims = jwt.verify(token, signingKey, { algorithms: ['HS256'] }) as jwt.JwtPayload;
```

This prevents algorithm confusion attacks where an attacker supplies a JWT signed with `alg: 'none'` or an asymmetric algorithm.

### 7. Store Slack access_token with API token metadata

Per product decision, store the user's Slack `access_token` in the `api_token` table so that API-token sessions can also call Slack APIs:

```typescript
// apiToken model
access_token: {
  type: DataTypes.STRING,
  allowNull: true,
},
```

```typescript
// Creating an API token
const { token } = await createApiToken(sess.user.id, name.trim(), sess.accessToken);
```

```typescript
// Loading an API-token session
const sess: Session = {
  id: apiToken.id,
  expireAt: claims.exp ? claims.exp * 1000 : Date.now() + (365 * 24 * 60 * 60 * 1000),
  accessToken: apiToken.accessToken || '',
  user: user,
};
```

## Why This Works

- **`SameSite: 'lax'`** prevents the browser from sending the `auth` cookie on cross-site POST/DELETE requests, closing the CSRF vector.
- **`secure: true`** ensures the cookie is only sent over HTTPS, preventing token theft on insecure networks.
- **`expiresIn: '365d'`** embeds an `exp` claim in the JWT. `jwt.verify` automatically rejects expired tokens, so a leaked token becomes useless after one year even if the database row still exists.
- **Restricting token-management to cookie auth** means an attacker who steals a single API token cannot use it to create more tokens or revoke existing ones. They would need the user's web session (the `auth` cookie), which is protected by `SameSite`.
- **Query parameter normalization** prevents Sequelize from interpreting an array as an `IN` clause, ensuring only a single token is deleted per request.
- **Type guards** fail fast on malformed input instead of propagating `undefined` into Sequelize or calling methods on non-string values.
- **Explicit `algorithms: ['HS256']`** in `jwt.verify` rejects tokens that specify a different algorithm, preventing algorithm confusion attacks.

## Prevention

- **Always set `sameSite` and `secure` on auth cookies**. Use `lax` for general auth cookies; `strict` only if you never navigate cross-site.
- **Always specify `expiresIn` (or `exp`) on JWTs**. Defaulting to no expiration is a footgun in `jsonwebtoken`.
- **Always specify `algorithms` in `jwt.verify`**. Never rely on the library default.
- **Normalize `req.query` values** in Next.js API routes. Assume they can be `string | string[]` until proven otherwise.
- **Guard all Sequelize `where` clauses** against `undefined`. Sequelize silently drops `undefined` values, turning `where: { id: undefined }` into `where: {}` (match all rows).
- **Scope API token capabilities**. Decide upfront whether API tokens should be allowed to manage other tokens, and enforce that restriction at the handler level, not just the auth layer.
- **Run multi-agent security review** on any new auth endpoints before merging. The CSRF and JWT expiration issues were caught by dedicated security and adversarial reviewers, not by the implementer.

## Related Issues

- Plan: `docs/plans/2026-05-11-001-feat-slackernews-cli-plan.md` (U1: API token model and generation endpoint)
- Pre-existing: `pages/login/callback.js` auth cookie lacked `SameSite`/`Secure` flags
- Pre-existing: `lib/session.ts` logged JWT signing key to console (still present; needs cleanup)
- Follow-up: Token rate limiting and scopes are deferred to post-v1 work per the plan
