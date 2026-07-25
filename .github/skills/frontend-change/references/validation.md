# Frontend validation matrix

| Change                     | Focused check                                       | Final checks                                                                                    |
| -------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Battle logic               | Relevant `tests/unit/battle/` and integration tests | `npm run lint`; `npm run format:check`; `npm run test`; `npm run build`                         |
| Data                       | Relevant data integrity tests                       | `npm run lint`; `npm run format:check`; `npm run test`; `npm run build`                         |
| Maps                       | `npm run map:validate -- --map <key>` and preview   | `npm run map:validate`; `npm run lint`; `npm run format:check`; `npm run test`; `npm run build` |
| Scene or UI                | Relevant unit test and Playwright spec              | `npm run lint`; `npm run format:check`; `npm run test`; `npm run build`; focused E2E            |
| Managers or saves          | Manager unit and integration tests                  | `npm run lint`; `npm run format:check`; `npm run test`; `npm run build`                         |
| Assets or build scripts    | Run the affected generator                          | `npm run build`; `bash scripts/check-bundle-size.sh`; tracked-file cleanliness check            |
| Performance-sensitive code | Focused performance scenario                        | `bash scripts/check-bundle-size.sh`; `npm run test:perf`                                        |

`npm run lint` is report-only; warnings are not failures. Use
`npm run test:coverage` when coverage is relevant, but never lower thresholds in
`tests/vitest.config.ts` to pass. `npm run test` includes the production
import-cycle and data-integrity guards. Builds and generators must leave tracked
files clean and deterministic.

Always update `docs/CHANGELOG.md` for code changes and `docs/bugs.md` for bug
findings. Update a directory's `CONTEXT.md` when files or responsibilities
change. For final validation policy, load `quality-gate`.
