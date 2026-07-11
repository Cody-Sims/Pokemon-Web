# Frontend validation matrix

| Change | Focused check | Final checks |
|---|---|---|
| Battle logic | Relevant `tests/unit/battle/` and integration tests | `npm run test`; `npm run build` |
| Data | Relevant data integrity tests | `npm run test`; `npm run build` |
| Maps | `npm run map:validate -- --map <key>` and preview | `npm run map:validate`; `npm run test`; `npm run build` |
| Scene or UI | Relevant unit test and Playwright spec | `npm run test`; `npm run build`; focused E2E |
| Managers or saves | Manager unit and integration tests | `npm run test`; `npm run build` |
| Assets or build scripts | Run the affected generator | `npm run build`; bundle-size check |
| Performance-sensitive code | Focused performance scenario | `bash scripts/check-bundle-size.sh`; `npm run test:perf` |

Always update `docs/CHANGELOG.md` for code changes. Update a directory's
`CONTEXT.md` when files or responsibilities change.
