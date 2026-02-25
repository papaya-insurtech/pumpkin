---
name: nodejs-convention
description: Node.js error handling, promises, retry, logging, and date-time conventions for Papaya projects
version: 1.0.0
---

# Node.js Convention

Apply these conventions when writing or reviewing Node.js backend code in Papaya projects.

## Error Handling Convention

- **BaseError / Custom Error** -- use custom error classes extending a BaseError.
- **Throw / Not to Throw** -- know when to throw errors vs. return error values.
- **Prevent silent errors** -- never swallow errors without logging or handling.
- **Reaction convention** -- define how different error types should be handled (retry, alert, ignore).

## Library Preference Convention

- Prefer built-in modules over third-party libraries.
- Prefer well-maintained third-party libraries over self-developed solutions.
- Self-developed solutions only when no suitable alternative exists.

## Promise Convention

- **Bluebird vs native Promise** -- use native Promises unless Bluebird-specific features are needed.
- **`.catch`/`.then` vs `try`/`catch`** -- prefer `async`/`await` with `try`/`catch`.
- **Sleep** -- use a simple Promise-based sleep utility.
- **Parallel convention** -- use `Promise.all` or `Promise.allSettled` for parallel execution.
- **Async/Await** -- always use async/await over `.then` chains.

## Retry Convention

- **Retry function** -- use standardized retry with exponential backoff.
- **Retry SQS** -- follow SQS retry patterns with dead-letter queues.
- **Retry Hasura Trigger** -- configure Hasura event trigger retry settings.

## Date Time Convention

- Use native `Date` for simple operations.
- Use `date-fns` for complex date operations.
- Use custom project utils that are built on top of `date-fns` and `Date`.

## Localization Convention

- Follow project-specific localization patterns.

## Logging Convention

- Use structured logging.
- Include context (request ID, user ID, operation) in log messages.

## GraphQL Codegen Convention

- Use `gql.tada` for type-safe GraphQL operations.
