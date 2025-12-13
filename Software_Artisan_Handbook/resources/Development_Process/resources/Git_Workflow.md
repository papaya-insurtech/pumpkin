# Git Workflow

## Gitflow Workflow

<https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow>

## Trunk-based Workflow

<https://trunkbaseddevelopment.com/>

<https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development>

## Papaya Workflow

We use the Gitflow Workflow with some customizations to align with the [Development Process](./Development_Process.md).

### Branches

There are 4 types of branches:

#### 1. Main Branch

This is the `main` branch of the repository.  
It is the default branch when you clone the repository. We map the Production environment to this branch.  
It is a long-lived branch.  
We can do hotfixes on this branch but only in the case of a super emergency. Only the Principal Software Artisan or Head of Engineering can do hotfixes on this branch.

#### 2. Environment Branches

These are our customizations from the Gitflow Workflow.  
We use multiple environment branches to map to different environments that are defined in [System Environment](./System_Environment.md).  
Environment branches are long-lived branches.

#### 3. Feature Branches

These are the branches that we use to develop new features and enhancements.  
These are short-lived branches. We will delete them after merging them into the environments branch.
When we start working on a task, we will create a feature branch from an environment branch.
Feature branches will be tested by Dev in their local machines, but still using the same environment as the environment branch.

#### 4. Hotfix / Bugfix Branches

These are the branches that we use to do bug fixes that appear in an environment.  
These are short-lived branches. We will delete them after merging them into the environments branch.
When we start working on a bug fix, we will create a Hotfix / Bugfix branch from an environment branch.
Hotfix / Bugfix branches will be tested by Dev in their local machines, but still using the same environment as the environment branch.

### Merge/Rebase Strategy

#### 1. Rebase when Pull from Remote

We using `rebase` option to pull from the remote.  
This strategy will keep the commit history between local-remote of a branch clean and easy to read.

#### 2. Merge on long-lived branches

We use `git merge` when want to merge changes from other branches into a long-lived branch.  
Due to these branches being long-lived, it usually has a lot of commits when rebase, causing the over-complicated rebase.  
This strategy is a safe way to prevent conflict-hell, losing code, duplicated commits, etc.

#### 3. Rebase on short-lived branches

We use `git rebase` when want to merge changes from a long-lived branch into a short-lived branch.  
A short-lived branch usually has a few commits, so it's easy to rebase.  
A rebase keeps the commit history straight so that it will be an easy fast forward merge when we want to merge it into a long-lived branch.

### Pull Request

Always create a Pull Request when you want to merge a branch into a long-lived branch.  
All Pull Requests must be reviewed by at least 1 Software Artisan (recommend 2) before merging.  
Should choose the option to squash commits into 1 commit before merging from a short-lived branch into a long-lived branch.
