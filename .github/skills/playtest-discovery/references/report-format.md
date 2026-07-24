# Playtest report format

`scripts/playtest/discover.mjs` writes three files:

| File                   | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `report.json`          | Complete options, scenario runs, observations, and findings |
| `report.md`            | Human-readable bug list with exact reproduction commands    |
| `finding-summary.json` | Compact reproducible-finding queue for automation           |

Each finding contains:

| Field                 | Meaning                                                        |
| --------------------- | -------------------------------------------------------------- |
| `id`                  | Stable `PT-` identifier derived from the fingerprint           |
| `fingerprint`         | Hash of kind, scenario, and normalized message                 |
| `kind`                | Browser error, failed request, checkpoint, or scenario failure |
| `scenario`            | Journey that observed the defect                               |
| `seed`                | Seed used for deterministic fuzz input                         |
| `actionIndex`         | Fuzz action position, or `null` during setup                   |
| `message`             | Normalized browser or checkpoint evidence                      |
| `evidence`            | Attempts, active scenes, and screenshot paths                  |
| `occurrences`         | Number of attempts in which the fingerprint appeared           |
| `reproducible`        | Whether the finding appeared in every requested attempt        |
| `reproductionCommand` | Exact focused command for replay                               |

The repair loop consumes only `reproducible: true` findings. The independent gate
runs `discover.mjs --verify` against the implementation worktree and rejects the
change if the original fingerprint or another blocking browser error remains.
