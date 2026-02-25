---
name: react-convention
description: React component, hooks, conditional rendering, and routing conventions for Papaya projects
version: 1.0.0
---

# React Convention

Apply these conventions when writing or reviewing React code in Papaya projects.

## Conditional Rendering

Use `&&` operator instead of ternary `? :` for conditional rendering. The `&&` operator is more readable and less error-prone. Only use `&&` when there is **one condition**.

```tsx
// BAD: multiple conditions with &&
<div onClick={() => claim != null && somethingBoolean && utils.calculateTat({ claim })}>TAT: {tat} hours.</div>

// GOOD: single condition with &&
<div onClick={() => claim != null && utils.calculateTat({ claim })}>TAT: {tat} hours.</div>
```

## Complex Conditional Rendering

Use `<If>` component for complex conditional rendering. `<If>` component cannot remove null/undefined from rendering children (TypeScript limitation, but it's safe at runtime). Normally [jsx-control-statements](https://www.npmjs.com/package/jsx-control-statements) is enough but [it doesn't work well with Vite](https://github.com/vitejs/vite/discussions/7927).

## Routing and Links

- Use react-router-dom's `<Link>` component instead of `<a>` tag for internal links.
- Never use `navigate()` in onClick for hyperlinks:

```tsx
// BAD
<div onClick={() => navigate("http://google.com")}>...</div>

// GOOD
<Link to="/some-path">...</Link>
```

- External links and links that open a new tab must use `<ExternalLink />` component from `app/common/components/ExternalLink`:

```tsx
// BAD
<Link target="_blank" to={generatePath(PORTAL_PATH.HC_CREATE_CLAIM_CASE_LA, { id })}>{name}</Link>

// GOOD
import ExternalLink from "app/common/components/ExternalLink";
<ExternalLink to={generatePath(PORTAL_PATH.HC_CREATE_CLAIM_CASE_LA, { id })}>{name}</ExternalLink>
```

## Convention Topics (Expand as needed)

- Apollo Client Convention (see `apollo-client-convention` skill)
- Error Handling Convention
- Library type (built-in, self-developed, 3rd party) preference
- React hooks convention
- Query data convention
- Styling convention
