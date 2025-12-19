# Git Tips Cheat Sheet

## Auto stash before rebase

This configuration will automatically stash any unstaged changes before performing a rebase, and unstash them after the rebase is complete. This is very useful to avoid the "Cannot rebase: You have unstaged changes" error.

```bash
git config rebase.autoStash true
```

If you want to apply this globally for all your repositories:

```bash
git config --global rebase.autoStash true
```
