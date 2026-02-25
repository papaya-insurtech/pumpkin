---
name: hasura-graphql-convention
description: Hasura database, permissions, naming, and table conventions for Papaya projects
version: 1.0.0
---

# Hasura/Database Convention

Apply these conventions when working with Hasura, database schema, and permissions in Papaya projects.

## Core Rules

- **Soft delete only** -- data never gets deleted, only marked as deleted. Always use soft delete. Reference: https://hasura.io/docs/latest/schema/common-patterns/data-modeling/soft-deletes/
- **Plural table names** -- table names should always end with plurals.
- **Many-to-many naming** -- many-to-many tables should be named `authors_books` (both words as plurals).
- **Alphabetical grouping** -- name tables so they sit alongside each other when viewing in Hasura Console or any database IDE. Example: `authors`, `authors_books`, `books`, `books_categories`, `categories`.

## Table Creation

### Mandatory Columns

- **id**: UUID, use `generate_random_uuid()`. Even many-to-many tables should have an id column. Exception: Enum tables.
- **created_at**: use Hasura suggestion.
- **created_by**: set up using Hasura's `x-hasura-user-id` header. Reference: https://hasura.io/docs/latest/auth/authorization/permissions/column-presets/
- **updated_at**: use Hasura suggestion.
- **updated_by**: set up using Hasura's `x-hasura-user-id` header.
- **deleted_at**: Timestamp, nullable.

### Foreign Keys

- All foreign keys should be set to `restrict` (do not use any other options), with no exceptions under any circumstances.

### Reading Errors

When you see an error indicating a role does not have permission to read a table related to another table (e.g., `companies` in relationship `company_campus_users`), it means the role's select permission is missing on the related table.

### Permissions

#### Select

- **Minimal Row select permissions**: filter out `deleted_at` records under `_and` for extensibility.
- **Filter deleted related objects**: filter out `deleted` related objects to avoid accessing properties of null objects at runtime. Soft deletion of object relationships causes GraphQL to not recognize the object as nullable.

## Convention Topics

- Permission convention (select, insert, update, delete)
- Role convention
- Relationship convention
- Naming convention (table, column, relationship)
- Retry trigger convention
- Transaction handling convention
- Default column convention (created_at, updated_at, deleted_at, created_by, updated_by, deleted_by)
- Column value type convention (Text, Number, Timestamptz, Enum, Jsonb)
- Unique constraint convention
- Index convention
- Migration convention
- Data seeding convention
- Metadata convention
- Environment convention
- Query/Update/Insert/Delete data convention
