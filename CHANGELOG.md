# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Since this is a pre-1.0 project,
it will track only significant breaking changes
and features, and is not intended to be an exhaustive list.

## [Unreleased]

## [v0.14.21] - 2019-07-18

This is a summary of breaking changes and new features since `v0.13`.

To upgrade a project from `v0.13` to `v0.14`, follow
[these steps](https://github.com/cardstack/cardboard/issues/95)

Affected APIs include:
- `searchers.get()`
- `searchers.getFromControllingBranch()`
- `searchers.searchFromControllingBranch()`
- `searchers.search()`
- `indexers.beginUpdate()`,
- `controlling-branch` dependency injection 
- `forBranch()`
- `forControllingBranch()` 
- `writers.create()`
- `writers.update()`
- linting config

### Changed
- [FEATURE] Improved UX and designs for the Right Edge #752

### Removed
- [BREAKING] remove concept of `branches` #747

## Prior versions

See the [Releases](https://github.com/cardstack/cardstack/releases) and git commit
history for changes prior to `v0.14`.