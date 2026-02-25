# Code Review Checklist

## General Checklist

- [ ] The PR is aligned with the solution in the Jira task.
- [ ] The PR has the correct name format.
- [ ] The commits have the correct message format.
- [ ] The PR has the correct merge branch.
- [ ] The PR has no changes that are not related to the Jira task.
- [ ] The PR has no merge conflicts.
- [ ] Naming conventions are followed.
- [ ] The code is readable and declarative.
- [ ] The code is clean: no unused code, no commented code, and no console logs.
- [ ] Using comments only to: explain WHY, Todo, and Warning.
- [ ] The code is tested.

## AI-Generated Code Checklist

- [ ] No hallucinated APIs -- all functions, methods, and imports actually exist and have the correct signatures.
- [ ] No scope creep -- the agent didn't "improve" code beyond what was asked (extra error handling, refactoring adjacent code, adding comments).
- [ ] Convention skill compliance -- code follows installed team convention skills (typescript-convention, react-convention, etc.).
- [ ] No hardcoded or placeholder values -- the agent didn't leave TODO comments, placeholder strings, or mock data.
- [ ] Business logic correctness -- the agent understood the domain correctly (insurance terms, claim flows, etc.).
- [ ] Security review -- no new vulnerabilities introduced (SQL injection via Hasura, XSS, exposed secrets).
- [ ] Agent instructions documented -- the PR description explains what the agent was directed to do.

## TypeScript Checklist

- [ ] Follow the `typescript-convention` skill conventions.

## Serverless Checklist

- [ ] Follow the `serverless-convention` skill conventions.
- [ ] All new environment variables are updated to SSM Parameter Store.
- [ ] The new serverless functions are only enabled in necessary environments.

## React Checklist

- [ ] Follow the `react-convention` skill conventions.

## ReactNative Checklist

- [ ] Follow the `react-native-convention` skill conventions.

## Hasura Checklist

- [ ] Follow the `hasura-graphql-convention` skill conventions.
- [ ] The PR has no Metadata changes that are not related to the Jira task.

## GraphQL Checklist

- [ ] Follow the `graphql-convention` skill conventions.

## Nodejs Checklist

- [ ] Follow the `nodejs-convention` skill conventions.
