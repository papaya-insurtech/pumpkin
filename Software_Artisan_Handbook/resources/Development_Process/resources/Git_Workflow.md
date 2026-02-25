# Git Workflow

Claude Code handles most git operations (branching, committing, pushing, rebasing, creating PRs). The engineer's role is to **direct** the operations and **resolve** conflicts when they require human judgment.

## Gitflow Workflow

<https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow>

## Trunk-based Workflow

<https://trunkbaseddevelopment.com/>

<https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development>

## Papaya Workflow

We use the Gitflow Workflow with customizations aligned with the [Development Process](../Development_Process.md).

### Branches

There are 4 types of branches:

#### 1. Main Branch

This is the `main` branch of the repository.
It is the default branch when you clone the repository. We map the Production environment to this branch.
It is a long-lived branch.
We can do hotfixes on this branch but only in super emergencies. Only the Principal Software Artisan or Head of Engineering can do hotfixes on this branch.

#### 2. Environment Branches

These are our customizations from the Gitflow Workflow.
We use multiple environment branches to map to different environments defined in [System Environment](./System_Environment.md).
Environment branches are long-lived branches.

#### 3. Feature Branches

Branches for developing new features and enhancements.
Short-lived branches -- deleted after merging into the environment branch.
Created from an environment branch when starting a task.
Tested by the engineer locally using the same environment as the environment branch.

**With Claude Code:** Direct the agent to create branches: `"Create a feature branch feat/claim-case-creation from dev"`. Claude Code handles the git commands.

#### 4. Hotfix / Bugfix Branches

Branches for bug fixes that appear in an environment.
Short-lived branches -- deleted after merging into the environment branch.
Created from an environment branch when starting a bug fix.

### Merge/Rebase Strategy

#### 1. Rebase when Pull from Remote

Use `rebase` to pull from the remote.
This keeps the commit history between local-remote of a branch clean and readable.

**With Claude Code:** Claude Code uses rebase by default when pulling. If conflicts arise, it will present them for your decision.

#### 2. Merge on Long-Lived Branches

Use `git merge` to merge changes from other branches into a long-lived branch.
Long-lived branches have many commits, making rebase overly complicated.
This is the safe approach to prevent conflict-hell, lost code, and duplicated commits.

#### 3. Rebase on Short-Lived Branches

Use `git rebase` to merge changes from a long-lived branch into a short-lived branch.
Short-lived branches have few commits, making rebase easy.
Rebase keeps the commit history straight for a clean fast-forward merge.

**With Claude Code:** Direct the agent: `"Rebase my branch on top of dev"`. If conflicts occur, Claude Code will show them. You resolve conflicts that require business judgment; Claude Code can handle straightforward ones.

### Pull Request

Always create a Pull Request when merging a branch into a long-lived branch.
All Pull Requests must be reviewed by at least 1 Software Artisan (recommend 2) before merging.
Should squash commits into 1 commit before merging from a short-lived branch into a long-lived branch.

**With Claude Code:** Direct the agent: `"Create a PR to merge into dev. Title: feat: [carrot] implement social login"`. Claude Code creates the PR with proper formatting. See [Reviewee Convention](./Code_Review/resources/Reviewee_Convention.md) for PR description requirements including agent instructions.

### Conflict Resolution

When Claude Code encounters merge conflicts:
1. It will show you the conflicting files and the nature of the conflict.
2. For straightforward conflicts (import ordering, formatting), let Claude Code resolve them.
3. For conflicts involving business logic or others' code, resolve manually or consult the relevant developer.
4. After resolving conflicts, always re-test the related features.
