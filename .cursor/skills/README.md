# Cursor Skills — dev-backendUI-uc

Project skills for the U Caldas transit + security admin SPA. Versioned in git under `.cursor/skills/`.

## Skills index

| Skill | Use when |
|-------|----------|
| [dev-backendui-overview](dev-backendui-overview/SKILL.md) | Onboarding, scoping work, choosing security vs business module |
| [dev-backendui-architecture](dev-backendui-architecture/SKILL.md) | Adding CRUD, use cases, stores, hooks, or refactoring layers |
| [dev-backendui-rbac](dev-backendui-rbac/SKILL.md) | Routes, guards, login, menu visibility, role checks |
| [dev-backendui-api](dev-backendui-api/SKILL.md) | HTTP clients, endpoints, env vars, API debugging |

## Reference files (read on demand)

| Skill | Detail file |
|-------|-------------|
| overview | [domains.md](dev-backendui-overview/domains.md) |
| architecture | [scaffold-checklist.md](dev-backendui-architecture/scaffold-checklist.md) |
| rbac | [guards-and-roles.md](dev-backendui-rbac/guards-and-roles.md) |
| api | [endpoints-and-env.md](dev-backendui-api/endpoints-and-env.md) |

## How to invoke

In Cursor Agent chat, mention the skill by name, e.g.:

> Use the dev-backendui-architecture skill to add a new CRUD for vehicles.

Skills use `disable-model-invocation: true` — they load when referenced explicitly or when the agent matches the description.

## Related documentation

- `docs/CLEAN_ARCHITECTURE.md`
- `docs/ROLE_BASED_ACCESS_CONTROL.md`
- `docs/BACKEND_INTEGRATION.md`
- `docs/TESTING_RBAC.md`
