# Contributing

## Branching
- Use short-lived branches such as `feat/room-creation`, `fix/upload-validation`, or `docs/api-contract`.
- Do not commit directly to the protected main branch.
- Keep pull requests focused on one task.

## Pull requests
Each PR should include:
- Goal and linked issue.
- Summary of behavior changes.
- Tests run and results.
- Screenshots or short recording for UI changes, where useful.
- Database migration and rollback notes, if applicable.
- Security/privacy impact.
- Documentation updates.
- Known limitations and follow-up tasks.

## Quality checks
Run the checks defined by the project once implementation exists. Do not claim a check passed unless you ran it. If a check cannot run, explain why.

## Shared AI workflow
- Read `AGENTS.md` and the relevant `docs/` files.
- Use a task-specific branch and explicit file ownership.
- Ask before changing product scope or major architecture.
- Never paste secrets, private images, embeddings, or production data into AI prompts.
- Treat generated code as untrusted until reviewed and tested.
