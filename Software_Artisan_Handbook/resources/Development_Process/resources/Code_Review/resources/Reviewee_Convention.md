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

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Common Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## 3. Pull Request (PR) Naming

Format: `<type>: [<scope>] <description>`

Example: `feat: [carrot] implement social login`, `fix: [carrot][ui] fix alignment on mobile`.

## 4. Reviewer Assignment

- Use GitHub's **Assignees** section to assign yourself to the PR.
- Use the **Reviewers** section to assign the appropriate team members.
- Tag the right people based on project ownership or expertise.

## 5. PR Description

A good PR description provides context and helps the reviewer understand your changes.

### Checklist

Include a checklist of what you have done in the PR:

- [ ] Task 1 completed
- [ ] Task 2 completed
- [ ] ...

### Agent Instructions (for AI-assisted PRs)

When code was generated with AI agents, document the agent workflow in the PR description:

- **What agent was used:** Claude Code, Claude Cowork, etc.
- **Key prompts/directions given:** Summarize the main instructions you gave the agent.
- **What you verified manually:** List what you checked after the agent generated code.
- **Known limitations:** Any areas where the agent's output was suboptimal and you chose to keep it as-is.

This helps reviewers understand the intent behind the code and focus their review on areas where AI agents commonly make mistakes.

Example:

```markdown
## Agent Workflow
- Used Claude Code to implement the claim case creation form
- Directed: "Follow the pattern in ExistingClaimScreen.tsx, use usePMutation, add notification on success"
- Verified: all imports exist, mutation returns correct fields, notification redirects to correct path
- Note: Claude initially used useQuery instead of usePQuery -- corrected in second iteration
```

### UI Changes

If your task involves UI changes, you **must** include:

- **Screenshots** or **Screen Recordings** showing the before and after (or just the new state).
- Ensure the screenshots are clear and represent the change accurately.

### External Links

- Include links to relevant Slack discussions.
- Always include a link to the relevant Jira task.

### Summary

Provide a brief summary of *what* changed and *why*, especially if it's not obvious from the code.
