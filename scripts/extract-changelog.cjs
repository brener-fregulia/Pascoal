#!/usr/bin/env node

// Extracts the CHANGELOG.md section for a given version and prints it to
// stdout. Used by release.yml to populate the GitHub release body instead
// of a static placeholder, and doubles as a guardrail: if there is no
// entry (or an empty one) for the version being tagged, this exits with a
// non-zero code, which fails the release build before any time is spent
// on it.

const fs = require('fs')
const path = require('path')

const version = process.argv[2]

if (!version) {
    console.error('Usage: node scripts/extract-changelog.cjs <version>')
    process.exit(1)
}

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
const content = fs.readFileSync(changelogPath, 'utf8')

const escaped = version.replace(/\./g, '\\.')
const headingRe = new RegExp(`^## \\[${escaped}\\]`, 'm')
const match = headingRe.exec(content)

if (!match) {
    console.error(
        `No CHANGELOG.md entry found for version ${version}. ` +
        `Add a "## [${version}]" section before tagging a release.`,
    )
    process.exit(1)
}

const start = match.index + match[0].length
const rest = content.slice(start)
const nextHeadingIndex = rest.search(/^## \[/m)
const section = (
    nextHeadingIndex === -1 ? rest : rest.slice(0, nextHeadingIndex)
).trim()

if (!section) {
    console.error(
        `CHANGELOG.md entry for ${version} is empty. ` +
        `Fill it in before tagging a release.`,
    )
    process.exit(1)
}

console.log(section)