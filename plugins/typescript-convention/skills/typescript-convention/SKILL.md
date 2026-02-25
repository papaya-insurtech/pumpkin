---
name: typescript-convention
description: TypeScript naming, syntax, logic, and type conventions for Papaya projects
version: 1.0.0
---

# TypeScript Convention

Apply these conventions when writing or reviewing TypeScript code in Papaya projects.

## Naming Convention

### General Rules

- Use camelCase for variable and function names.
- Use PascalCase for class and interface names.
- Use UPPER_CASE for constants.
- Respect English grammar.
- Always use descriptive names, even if they are long names.
- Always use the same term (in English) as the Product team (or other non-tech teams) use to name things.
- Always use ubiquitous language.

### Variables

- Use descriptive names that convey the purpose of the variable.
- Only use single-letter (or short) variable names for a small enough code block.
- Prefix boolean variables with a word that indicates they are boolean values and aligned with English grammar and the meaning of the variable. For example, `isLoading`, `hasError`, `shouldUpdate`.
- Use plural names for arrays. For example, `users`, `items`, `children`, `livesAssured`.

### Functions

- Use verbs or verb phrases for function names that describe what the function does. For example, `getUser`, `calculateTotal`.
- Use descriptive names for function parameters.

### Types

- Use nouns or noun phrases for class names that describe what the class represents. For example, `User`, `Product`.
- Use PascalCase for Type names.
- Use singular names for types that are not array Types.
- Use unused args with a leading underscore. For example, `_name`, `_age`.
- Use getters and setters for accessing private properties.

### Enums

- Use UPPER_CASE for enum names.

## Syntax Convention

- Prefer modern syntax or syntax sugar:
  - Spread syntax
  - Destructuring assignment
  - Optional chaining (know when to use and when not to)
  - Nullish coalescing operator
  - Template literals
  - Arrow functions
- Nullish check: `== null` or `!= null` for checking `null` or `undefined`.
- Restrict implicit truthy and falsy checking.
- Use proper type conversion.
- Prevent default values using the `||` operator.

## TypeScript-Specific Rules

- Do not use `undefined` as a value. Use `null`.
- Do not use `any` type in committed code. Use `any` while working on the code until you figure out the types. Typing things from the start is a good practice.
- Nullish coalescing operator (`??`) should be carefully placed at the **last part** of an expression for readability and data fallback.

### Bad nullish coalescing usage -- do not remove nullish prematurely:

```ts
// BAD: unnecessary data fallback -- TableList accepts nullish by default
<TableList data={certificate.insured_certificate?.claim_cases ?? []} />

// BAD: premature fallback causes issues when data is further consumed
const allClaims = (res.data?.claim_case_details ?? []).concat(
  await getClaimCasesUntilEnough({ exportTime, where, total, offset: countFetchItems, updateProgress }),
);

// GOOD: place ?? at the end of the full expression
const allClaims = (res.data?.claim_case_details).concat(
  await getClaimCasesUntilEnough({ exportTime, where, total, offset: countFetchItems, updateProgress }),
) ?? [];
```

### Bad fallback -- guard with null check instead:

```ts
// BAD: email?.id ?? "" will crash generatePath
<Link to={generatePath(PORTAL_PATH.MAILBOX.EMAIL_DETAIL_DEFAULT, { emailId: email?.id ?? "" })}>

// GOOD: remove null early with a guard
if (email == null) return <Spin spinning={loading} />;
// now email.id is safely accessible
<Link to={generatePath(PORTAL_PATH.MAILBOX.EMAIL_DETAIL_DEFAULT, { emailId: email.id })}>
```

## Logic Convention

- Prefer early return over nested if-else.
- Prefer the ternary operator over if-else.
- Prefer switch case or multiple if over nested if-else.
- Prefer key/value map over switch case.

## Declarative Programming

Prefer declarative over imperative style:

```typescript
const numbers = [1, 2, 3, 4, 5];

// Imperative -- avoid
const filteredNumbers = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 2) {
    filteredNumbers.push(numbers[i]);
  }
}

// Declarative -- prefer
const filteredNumbers2 = numbers.filter(num => num > 2);
```

## Type Convention

- Favor `type` over `interface`.
- Favor `string Unions` over `enum`.
- Favor [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) over self-defined types.
