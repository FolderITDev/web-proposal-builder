# API conventions and errors

The complete reference is the OpenAPI 3.1 document at `/apps/proposal-builder/api/openapi.json`, rendered on the API reference page at `/apps/proposal-builder/docs/api`. This page explains the conventions behind it.

## Conventions

- JSON request and response bodies. PDFs are `application/pdf` downloads.
- Amounts are integer minor units (`unitPriceMinor`, `totalMinor`); quantities are decimals with at most two places; rates and shares are basis points (`taxRateBps: 2100` is 21%).
- `PATCH /proposals/{id}` replaces the whole document and/or changes the status. Always send the `version` you read; the response carries the new one.
- Lists return `{ items, page, pageSize, total, counts }` and accept `page`, `pageSize` (max 50), `status`, `q` and `sort` (`updated-desc`, `updated-asc`, `total-desc`, `total-asc`, `number-desc`).
- Dates are `YYYY-MM-DD`; timestamps are ISO 8601 in UTC; identifiers are UUIDs.
- There is no authentication. Your own proposals are identified by the `pb_session` HttpOnly cookie set when you create one.

## Errors

Every error is an [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem with `Content-Type: application/problem+json`. Branch on `code`; `detail` is written for people and may change.

```json
{
  "type": "https://github.com/FolderITDev/web-proposal-builder/blob/main/docs/api.md#version_conflict",
  "title": "Conflict",
  "status": 409,
  "code": "version_conflict",
  "detail": "This proposal was changed in another tab or window. Reload it to see the latest version."
}
```

### validation_failed

`422`. A field, query parameter or status change is invalid. `errors` lists each problem with its path, such as `document.terms.milestones` or `status`.

### version_conflict

`409`. The proposal changed since you read it. Fetch it again and reapply your change.

### forbidden

`403`. Example proposals are read-only and cannot be deleted. Duplicate one to edit it.

### not_found

`404`. The proposal does not exist, was removed, or belongs to another browser. These cases are deliberately indistinguishable.

### rate_limited

`429`. More than 30 proposals created from one client in 10 minutes. The `Retry-After` header gives the wait in seconds.

### internal_error

`500`. An unexpected failure. Details are logged on the server, never returned.
