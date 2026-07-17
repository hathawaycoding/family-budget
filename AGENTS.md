# Repository Notes

- This repo does not contain an app scaffold yet. There is no `package.json`, lockfile, CI workflow, test runner config, or root OpenCode config as of now.
- Do not invent setup, build, lint, typecheck, test, Docker, Prisma, or Next.js commands from `Plans/design.md`; that file is a proposed architecture, not executable repo state.

# Source Of Truth

- `Plans/plan.md` is the product behavior spec.
- `Plans/design.md` is the technical design and explicitly says it must not override `Plans/plan.md`.
- If those files conflict, follow `Plans/plan.md` and update `Plans/design.md` instead of implementing the conflict silently.

# Current Repo Shape

- `Plans/` holds the only project-specific app guidance today.
- `.agents/skills/` contains vendored skill content for OpenCode sessions, not the family-budget app itself.
- `skills-lock.json` records the pinned external skill sources and hashes.

# Working Rules

- Treat missing runtime files as intentional current state. If asked to implement the app, scaffold from scratch rather than assuming hidden packages or commands exist.
- When editing planning docs, preserve the distinction between product requirements in `Plans/plan.md` and implementation guidance in `Plans/design.md`.
- Avoid repo-wide cleanup of `.agents/skills/*` unless the task is specifically about agent skills; those files are imported skill assets.

# Verified Constraints From Existing Instructions

- `frontend-design` skill: when doing UI work, make the visual direction distinctive and non-templated.
- `web-design-guidelines` skill: fetch the latest Vercel web interface guidelines before performing a UI review.
- `grill-me` skill exists only to run a `/grilling` session.
