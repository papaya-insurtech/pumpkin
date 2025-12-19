# Git Common Actions Cheat Sheet

## Branch Management

Instead of `git checkout`, use `git switch` which is more intuitive for branch operations.

### Switch to an existing branch

```bash
git switch <branch-name>
```

### Create and switch to a new branch

```bash
git switch -c <new-branch-name>
```

## Staging Changes

Instead of `git add .`, use `git add --all` (or `git add -A`) to stage all changes, including deletions and files in subdirectories.

```bash
git add --all
```

## Pulling Changes

We prefer using `rebase` when pulling to keep a clean linear history.

### Pull with rebase (default)

If you have configured `pull.rebase true`, you can just run:

```bash
git pull
```

Otherwise, you can force rebase:

```bash
git pull --rebase
```

## Pushing Changes

To push the current branch to the remote without typing the branch name:

```bash
git push origin HEAD
```

This will push your current local branch to a branch with the same name on `origin`.
