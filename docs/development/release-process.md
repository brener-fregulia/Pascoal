# Release Process

## Purpose

This document defines the release preparation and publication process for Pascoal.

It covers:

* release readiness;
* version selection;
* changelog and localized release notes;
* version synchronization;
* validation;
* tag-triggered publication;
* artifact verification;
* handling failed or partial releases.

General repository, safety, and Git rules are defined in `AGENTS.md`.

The broader development flow is defined in:

```text
docs/development/workflow.md
```

Testing details are defined in:

```text
docs/development/testing.md
```

## Release model

Pascoal releases are published through GitHub Actions.

The release workflow is triggered by a pushed tag matching:

```text
v*
```

A release version therefore uses two related forms:

```text
Version: 2026.4.0
Tag:     v2026.4.0
```

Creating and pushing the tag remains a manual repository-owner operation.

The release workflow:

1. checks out the tagged revision;
2. derives the version from the tag;
3. extracts the matching `CHANGELOG.md` section;
4. installs build dependencies;
5. builds Pascoal for Windows and Linux;
6. signs updater artifacts;
7. creates or updates the GitHub Release;
8. publishes the generated assets.

The release is currently published directly rather than created as a draft.

## Versioning

Pascoal uses:

```text
YEAR.RELEASE.PATCH
```

Example:

```text
2026.4.0
```

The segments represent:

* `YEAR`: release year;
* `RELEASE`: release sequence within the year;
* `PATCH`: corrective follow-up for that release.

Examples:

```text
2026.4.0  Fourth release sequence of 2026
2026.4.1  Patch for 2026.4.0
2027.1.0  First release sequence of 2027
```

This is not standard Semantic Versioning, even though the version has three numeric segments.

The `RELEASE` segment does not represent one Feature. A release may contain multiple
Features, Fixes, and Refactors.

The current version script validates only the numeric `X.Y.Z` shape. The repository
owner remains responsible for selecting a version consistent with
`YEAR.RELEASE.PATCH`.

## Sources of release information

Each release-related source has a distinct purpose.

| Source                                  | Responsibility                                            |
| --------------------------------------- | --------------------------------------------------------- |
| GitHub Milestone                       | Approved release scope and progress                        |
| GitHub Issues / Project                  | Completed Features, Fixes, Refactors, and Work Packages    |
| `CHANGELOG.md`                          | Complete versioned release record and GitHub Release body |
| `src/i18n/release-notes/locales/*.json` | Concise localized notes displayed inside Pascoal          |
| Version-bearing files                   | Application and package version                           |
| `.github/workflows/release.yml`         | Build and publication automation                          |
| Git tag                                 | Immutable release trigger and source revision             |
| GitHub Release                          | Public downloads and release presentation                 |

Do not copy the complete changelog into the localized in-application notes.

## Responsibilities

### Release preparation agent

A release preparation agent may:

* inspect repository state;
* identify the current and target versions;
* verify release files;
* update approved release documentation;
* run the version script when explicitly requested;
* execute approved validation;
* produce a readiness checklist;
* report inconsistencies;
* suggest Conventional Commit messages.

It must not:

* create or modify tags;
* push commits or tags;
* publish or delete releases;
* alter Git history;
* discard working-tree changes;
* expose signing credentials.

### Repository owner

The repository owner:

* approves the target version;
* reviews and creates release commits;
* creates the tag;
* pushes the tag;
* monitors GitHub Actions;
* evaluates failed or partial releases;
* validates published artifacts;
* decides whether a release must be edited, retried, or removed.

## Release preparation stages

A normal release preparation consists of:

1. determine the target version;
2. confirm release scope;
3. finalize changelog content;
4. finalize localized release notes;
5. run release validation;
6. update version files;
7. verify the resulting diff;
8. create the version commit manually;
9. create and push the tag manually;
10. monitor publication;
11. validate the published release.

Changelog, release notes, and version bump may remain separate commits when that improves review and traceability.

## 1. Determine the target version

Before editing files, identify:

* current released version;
* current repository version;
* intended target version;
* whether the target starts a new release sequence or is a patch;
* previous release tag;
* changes intended for the release.

Do not infer the target version solely from the current year or unfinished roadmap items.

Confirm that the target version:

* follows `YEAR.RELEASE.PATCH`;
* is newer than the current release;
* is not already used by a tag or changelog section;
* matches the intended release scope.

## 2. Confirm release scope

Start from the target GitHub Milestone and its completed, validated work.

Then verify that scope against the repository changes since the previous release
so release communication cannot include work that is absent from the release
revision.

The release scope should include only completed and validated work.

Check for:

* features;
* fixes;
* relevant refactors;
* user-visible changes;
* dependency or infrastructure changes;
* known limitations;
* documentation changes;
* translated interface changes;
* migration or compatibility concerns.

Do not include:

* unfinished behavior;
* unmerged experimental work;
* roadmap items;
* internal plans;
* changes that are not present in the release revision.

## 3. Prepare `CHANGELOG.md`

Create a section using the existing Keep a Changelog structure.

Example:

```markdown
## [2026.4.0]

### Added

- ...

### Changed

- ...

### Fixed

- ...
```

Use only categories that contain entries.

Entries should:

* describe completed behavior;
* be understandable without reading the commits;
* emphasize user or maintainer impact;
* avoid unnecessary implementation detail;
* avoid commit-message fragments;
* avoid promising future work.

Update the comparison links at the bottom of the file.

The `[Unreleased]` link should compare the target version with `HEAD`:

```markdown
[unreleased]: https://github.com/brener-fregulia/Pascoal/compare/v2026.4.0...HEAD
```

Add the target version comparison:

```markdown
[2026.4.0]: https://github.com/brener-fregulia/Pascoal/compare/v2026.3.0...v2026.4.0
```

The release workflow requires a non-empty section whose heading exactly matches:

```markdown
## [VERSION]
```

Verify the section locally with:

```text
node scripts/extract-changelog.cjs 2026.4.0
```

The command should print only the intended release section.

## 4. Prepare localized release notes

Update the release-note locale files under:

```text
src/i18n/release-notes/locales/
```

Currently supported files are:

```text
en.json
es-419.json
pl.json
pt-BR.json
```

Add the same version key to every supported locale:

```json
{
  "2026.4.0": "Concise user-facing release summary."
}
```

The note should:

* be shorter than the changelog;
* highlight the most relevant user-facing result;
* use natural language;
* preserve established terminology;
* describe only released behavior;
* remain semantically consistent across languages.

Verify:

* valid JSON;
* identical version keys across all locales;
* no missing translation;
* no duplicated version key;
* correct version ordering where maintained by convention;
* correct punctuation and product terminology.

The release-note loader reads entries by version. No central version registration should be assumed unless the current implementation changes.

## 5. Validate the release candidate

Use the commands currently defined by the repository.

At minimum, evaluate:

```text
npm run test:frontend
npm run test:rust
npm run test:pascal
```

The aggregate command is currently:

```text
npm test
```

It runs frontend, Rust, and Pascal integration tests sequentially.

Pascal integration tests require FPC.

Additional validation may include:

```text
npm run build:ide
cargo tauri build
```

Run broader or platform-specific validation according to the release scope.

A complete release should consider:

* frontend tests;
* Rust tests;
* Pascal integration tests;
* frontend production build;
* Windows-specific behavior;
* Linux-specific behavior;
* updater-related changes;
* installation-related changes;
* manual application flows;
* known issues.

E2E testing is currently paused and is not a release requirement.

Record commands that could not run and their concrete reasons.

## 6. Update the version

Use the existing version script:

```text
npm run set-version -- 2026.4.0
```

The script currently updates:

```text
package.json
package-lock.json
src-tauri/Cargo.toml
src-tauri/tauri.conf.json
```

Do not edit these files independently unless the script cannot represent an approved requirement.

After running it, verify that all version-bearing files contain the same target version.

`src-tauri/Cargo.lock` is generated by Cargo and must not be edited manually. Run an appropriate Cargo command and review any resulting lockfile change.

The version script does not create:

* changelog entries;
* localized release notes;
* commits;
* tags;
* GitHub Releases.

## 7. Review the release diff

Before the version commit, review the complete release preparation diff.

Confirm that:

* all intended version files match;
* no unrelated dependency changed;
* lockfile changes are expected;
* the changelog section exists and is non-empty;
* changelog comparison links are correct;
* all localized release notes include the target version;
* no locale was omitted;
* no secrets or local paths were added;
* no unrelated files were changed;
* tests and builds have documented results.

A release agent should report the files changed but must not create the commit.

Typical commit boundaries may be:

```text
docs(changelog): add version 2026.4.0 changes
```

```text
docs(release): add version 2026.4.0 release notes
```

```text
chore(release): bump version to 2026.4.0
```

Combining directly related documentation changes is acceptable when they remain easy to review.

## Pre-tag checklist

Before creating the tag, confirm:

* [ ] Target version follows `YEAR.RELEASE.PATCH`.
* [ ] Target version is present in every version-bearing file.
* [ ] `CHANGELOG.md` contains a non-empty target section.
* [ ] Changelog comparison links are correct.
* [ ] Changelog extraction succeeds.
* [ ] All release-note locales contain the target version.
* [ ] Frontend tests pass.
* [ ] Rust tests pass.
* [ ] Pascal integration tests pass, or the limitation is documented.
* [ ] Relevant builds succeed.
* [ ] Required manual validation is complete.
* [ ] CI for the release revision is successful.
* [ ] Working-tree contents are understood.
* [ ] Release commits were reviewed and created manually.
* [ ] The intended release commit is the revision that will receive the tag.
* [ ] GitHub Actions signing secrets are configured.
* [ ] No release with the same tag already exists.

Do not proceed merely because the version script succeeded.

## Tag and publication

After all preparation commits are complete, the repository owner creates and pushes:

```text
v2026.4.0
```

The tag must point to the exact reviewed release revision.

Pushing a matching tag triggers:

```text
.github/workflows/release.yml
```

The workflow uses a Windows and Linux matrix.

It extracts the version by removing the leading `v` from the tag name.

The release title follows:

```text
Pascoal v2026.4.0
```

The GitHub Release body is populated from the matching changelog section.

## Workflow requirements

The release workflow currently requires:

* GitHub `contents: write` permission;
* GitHub `actions: write` permission;
* `GITHUB_TOKEN`;
* `TAURI_SIGNING_PRIVATE_KEY`;
* `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`;
* Node.js 22;
* stable Rust;
* platform build prerequisites.

Signing secrets must remain in GitHub Actions secrets.

Never print, copy, commit, or include private signing material in logs or documentation.

## Expected artifacts

The exact asset names depend on the current Tauri configuration and build tooling.

The release should be checked for the expected supported formats, currently including:

### Windows

* NSIS installer;
* updater artifacts and signature.

### Linux

* Debian package;
* RPM package;
* AppImage;
* updater artifacts and signatures.

### Updater

* `latest.json`;
* signed update packages required by the configured updater.

Do not consider the release complete merely because the GitHub Release page exists.

## Post-publication validation

After the workflow completes, verify:

* both matrix jobs succeeded;
* the release is published under the correct tag;
* the release title is correct;
* the changelog section appears correctly;
* expected Windows assets exist;
* expected Linux assets exist;
* updater metadata exists;
* signatures exist where required;
* download links work;
* package names and versions are correct;
* the release is marked as the latest appropriate release;
* the application can detect the update;
* updater installation works on relevant platforms when practical.

At minimum, install or inspect representative artifacts for each supported platform affected by the release.

## Failed changelog extraction

The workflow stops early when:

* the target changelog section does not exist;
* the section heading does not match the tag version;
* the section is empty;
* the extraction script fails.

Correct the repository content before attempting publication again.

Do not create a different changelog version merely to match an accidental tag.

## Build failure

Because the platform matrix does not fail fast, one platform may finish while another fails.

When a job fails:

1. identify the failed platform and step;
2. determine whether the failure is caused by code, configuration, dependency availability, signing, cache, or runner environment;
3. verify whether a partial GitHub Release or partial assets were published;
4. correct the underlying problem;
5. rerun or republish only through a deliberate repository-owner decision;
6. verify all expected artifacts after recovery.

Do not hide a platform failure because another platform succeeded.

## Partial release

A release is partial when the GitHub Release exists but one or more required assets are missing or invalid.

The repository owner must decide whether to:

* rerun the failed workflow jobs;
* correct the release revision and use a new patch version;
* temporarily edit the public release;
* remove an invalid release or tag.

Agents may analyze and recommend an option, but must not perform publication or destructive GitHub operations without explicit authorization.

Avoid replacing an already distributed tag with different source content.

## Signing failure

When signing fails:

* confirm that the expected secrets exist;
* confirm secret names match the workflow;
* inspect whether the private key or password was rejected;
* avoid printing secret values;
* do not disable signing to force publication;
* do not publish updater metadata without valid signatures.

A build that succeeds without required updater signatures is not a complete updater release.

## Release correction

Prefer a new patch release when a published release contains incorrect code or artifacts.

Example:

```text
2026.4.0  Original release
2026.4.1  Corrected release
```

Do not silently move or replace a published version tag with different source content.

Edits to release text that do not alter the released source or binaries may be performed manually by the repository owner when appropriate.

## Release report

A release preparation task should report:

### Target

Current version, target version, and release type.

### Readiness

Completed and incomplete checklist items.

### Files

Release-related files inspected or changed.

### Validation

Commands executed and their actual results.

### Artifacts

Expected platforms and package formats.

### Risks

Missing validation, environment limitations, signing concerns, or partial-release risks.

### Manual actions

Commits, tag creation, push, workflow monitoring, and publication steps that remain with the repository owner.

### Suggested commit

One Conventional Commit message describing only the changes made in the current task.
