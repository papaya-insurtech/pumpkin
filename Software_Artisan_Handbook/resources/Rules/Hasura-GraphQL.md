# Hasura

## Rules

- Data never gets deleted, only marked as deleted. In other words, always use soft delete. https://hasura.io/docs/latest/schema/common-patterns/data-modeling/soft-deletes/
- Table names should always end with plurals.
- Many-to-many tables should be named `authors_books` (both words as plurals).
- Name tables so that they sit alongside each other in a group when viewing in Hasura Console or any database IDE. For example, `authors`, `authors_books`, `books`, `books_categories`, `categories`.

## Table Creation

### Mandatory columns

- id: UUID, use generate_random_uuid(). Even many-to-many tables should have an id column. Exceptions should only be made if you know what you are doing. Exception: Enum tables.
- updated_at: use Hasura suggestion.
- updated_by: set up using Hasura's `x-hasura-user-id` header: https://hasura.io/docs/latest/auth/authorization/permissions/column-presets/
- created_at: use Hasura suggestion.
- created_by: set up using Hasura's `x-hasura-user-id` header: https://hasura.io/docs/latest/auth/authorization/permissions/column-presets/
- deleted_at: Timestamp, nullable.

### Foreign keys
- All foreign keys should be set to `restrict`, no exceptions under any circumsances.

# GraphQL