# AI Challenge 13 — Partner Integration SDK

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Advanced · 5–7 hours

## Context

Insurance partners (hospitals, brokers, corporates) embed claim submission functionality in their own applications. They need an SDK that abstracts the complexity of the claims API so they can integrate in minutes, not days.

## Problem

Design and build a JavaScript/TypeScript SDK that partners use to submit claims, upload documents, and track claim status. Include a mock API server to test against.

## Requirements

### Mock API Server

Build a simple HTTP server that implements these endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/token | Exchange API key for JWT (expires in 1 hour) |
| POST | /api/v1/claims | Create a new claim |
| GET | /api/v1/claims/:id | Get claim details and status |
| GET | /api/v1/claims | List claims (paginated, filterable by status) |
| POST | /api/v1/claims/:id/documents | Upload a document |
| GET | /api/v1/claims/:id/documents | List documents for a claim |

The mock server should:
- Validate authentication (reject expired/missing tokens)
- Validate request bodies (return 400 with field-level errors)
- Simulate realistic response times (200–500ms delay)
- Simulate transient failures (~10% of requests return 503)
- Store data in memory (no database needed)

### SDK

**Initialization:**
```typescript
const sdk = new InsuranceSDK({
  apiKey: 'pk_test_xxx',
  environment: 'sandbox', // or 'production'
  timeout: 30000, // optional, default 30s
});
```

**Claims:**
```typescript
// Create
const claim = await sdk.claims.create({
  policyId: 'POL-123',
  claimType: 'OUTPATIENT',
  diagnosisCode: 'J06.9',
  treatmentDate: '2024-03-15',
  amount: 15000,
  currency: 'THB',
});

// Get
const claim = await sdk.claims.get('CLM-001');

// List with filters
const claims = await sdk.claims.list({
  status: 'PENDING',
  page: 1,
  pageSize: 20,
});
```

**Documents:**
```typescript
const doc = await sdk.documents.upload(claimId, file, {
  type: 'medical_receipt',
  onProgress: (percent) => console.log(`${percent}% uploaded`),
});
```

**Status tracking:**
```typescript
sdk.claims.onStatusChange(claimId, (newStatus, claim) => {
  console.log(`Claim ${claimId} is now ${newStatus}`);
});
```

**Error handling:**
```typescript
try {
  await sdk.claims.create({ /* invalid data */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.fields); // { policyId: 'required', amount: 'must be positive' }
  } else if (error instanceof AuthError) {
    console.log('Re-authenticate');
  } else if (error instanceof NetworkError) {
    console.log('Retry later');
  }
}
```

### SDK Features
- Client-side validation before API call (required fields, field formats)
- Automatic token refresh when JWT expires
- Automatic retry with exponential backoff for transient failures (503, network errors)
- Typed errors: ValidationError, AuthError, NetworkError, ApiError
- Full TypeScript types — no `any`, accurate autocompletion
- Progress tracking for document uploads

### Documentation
- README with quickstart (install → authenticate → create first claim)
- API reference for all public methods
- 3 example integration scripts:
  1. Simple claim submission
  2. Claim submission with document upload
  3. Polling for claim status updates

### Tests
- At least 20 unit tests covering:
  - Successful flows (create, get, list, upload)
  - Client-side validation (missing fields, invalid formats)
  - Authentication (token refresh, expired token)
  - Retry logic (transient failure → successful retry)
  - Error handling (each error type)

## Evaluation Criteria

- All 3 example integrations work end-to-end against the mock API
- Client-side validation catches invalid submissions before API call
- Retry logic handles the mock server's simulated 503 failures
- TypeScript types are accurate and provide useful autocompletion
- Documentation is clear enough for a developer to integrate without additional help
- Test coverage of core flows and error paths

## Submission

- Push your project onto a GitHub repository
- Include the mock server, SDK source, tests, documentation, and example scripts
