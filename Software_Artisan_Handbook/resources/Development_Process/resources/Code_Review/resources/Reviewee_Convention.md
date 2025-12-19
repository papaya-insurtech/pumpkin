# Reviewee Convention

As a developer submitting code for review, you are responsible for ensuring that your Pull Request (PR) is easy to understand, well-structured, and follows our project's conventions. This helps reviewers provide better feedback and speeds up the review process.

## 1. Branch Naming

All branches should be prefixed with the type of change:

- `feat/`: New features
- `fix/`: Bug fixes
- `chore/`: Maintenance tasks, dependency updates, etc.
- `refactor/`: Code refactoring without changing functionality
- `docs/`: Documentation changes
- `test/`: Adding or updating tests

Example: `feat/add-user-authentication`, `fix/issue-with-login-form`.

## 2. Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. A commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Common Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## 3. Pull Request (PR) Naming

The PR title should follow a format similar to commit messages, making it clear what the PR addresses.

Format: `<type>: [<scope>] <description>`

Example: `feat: [carrot] implement social login`, `fix: [carrot][ui] fix alignment on mobile`.

## 4. Reviewer Assignment

- Use GitHub's **Assignees** section to assign yourself to the PR.
- Use the **Reviewers** section to assign the appropriate team members who should review your code.
- Ensure you have tagged the right people based on the project's ownership or expertise.

## 5. PR Description

A good PR description provides context and helps the reviewer understand your changes.

### Checklist

Include a checklist of what you have done in the PR:

- [ ] Task 1 completed
- [ ] Task 2 completed
- [ ] ...

### UI Changes

If your task involves UI changes, you **must** include:

- **Screenshots** or **Screen Recordings** showing the before and after (or just the new state).
- Ensure the screenshots are clear and represent the change accurately.

### External Links

- If the PR is related to a specific discussion, thread, or message in **Slack**, include the link in the description.
- Always include a link to the relevant **Jira** task or issue tracker.

### Summary

Provide a brief summary of *what* changed and *why* it was changed, especially if it's not obvious from the code.
