## Summary

<!-- What does this PR do and why? Link the related issue: Closes #<number> -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no behaviour change)
- [ ] Documentation
- [ ] CI / tooling

## Changes

<!-- Bullet list of the key changes. Keep it short — the diff is the source of truth. -->

-
-

## Testing

<!-- How did you verify this works? -->

- [ ] `make test` passes
- [ ] `make lint` passes
- [ ] Manually tested locally (describe the scenario below)

**Manual test scenario:**

## Checklist

- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] New logic in `pkg/`, `model/`, or `app/` has tests
- [ ] Migrations are additive (no destructive column changes without a maintenance comment)
- [ ] Docs in `docs/` updated if self-hosting or configuration is affected
- [ ] No `store/` imports from `api/`; no `api/` imports from `app/` or `store/`
