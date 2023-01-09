# Git undo changes cheat sheet

## Unstaged a file or directory

```bash
git reset path/to/file_or_dir
or
git restore --staged path/to/file_or_dir
```

## Revert file changed if the change is unstaged

```bash
git checkout path/to/file_or_dir
or
git restore path/to/file_or_dir
```

## Move the Current Branch to a specific commit and keep the change

```bash
# Keep the change as unstaged changes
git reset <commit/branch>
or
git reset --mixed <commit/branch>

# Keep the change as staged changes
git reset --soft <commit/branch>
```

### Example

```bash
# Undo the last 1 commit and keep the change as unstaged changes
git reset <commit/branch> HEAD~1
# Undo the last 2 commits and keep the change as unstaged changes
git reset <commit/branch> HEAD~2

# Undo all un-pushed commits of a branch in local and keep the change as unstaged changes
git fetch
git reset feature/example origin/feature/example
```

## DANGEROUS - Move the Current Branch to a specific commit and discard all changes

```bash
git reset --hard <commit/branch>
```

## Replace the content of a file with the content of the same file in a specific commit, does not move the Current Branch

```bash
git restore --source <commit/branch> path/to/file_or_dir
```
