#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const version = process.argv[2]

if (!version) {
    console.error('Usage: node scripts/set-version.js <version>')
    console.error('Example: node scripts/set-version.js 2026.1.0')
    process.exit(1)
}

if (!/^\d{4}\.\d+\.\d+$/.test(version)) {
    console.error('Version must follow YEAR.FEAT.PATCH format: e.g. 2026.1.0')
    process.exit(1)
}

const root = path.join(__dirname, '..')

const files = [
    {
        file: 'package.json',
        update: (content) => {
            const json = JSON.parse(content)
            json.version = version
            return JSON.stringify(json, null, 2) + '\n'
        }
    },
    {
        file: 'package-lock.json',
        update: (content) => {
            const json = JSON.parse(content)
            json.version = version
            if (json.packages?.['']) json.packages[''].version = version
            return JSON.stringify(json, null, 2) + '\n'
        }
    },
    {
        file: 'src-tauri/Cargo.toml',
        update: (content) => {
            return content.replace(/^version = ".*"/m, `version = "${version}"`)
        }
    },
    {
        file: 'src-tauri/tauri.conf.json',
        update: (content) => {
            const json = JSON.parse(content)
            json.version = version
            return JSON.stringify(json, null, 2) + '\n'
        }
    },
]

let success = true

for (const { file, update } of files) {
    const filePath = path.join(root, file)
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const updated = update(content)
        fs.writeFileSync(filePath, updated, 'utf-8')
        console.log(`✓ ${file}`)
    } catch (err) {
        console.error(`✗ ${file}: ${err.message}`)
        success = false
    }
}

if (success) {
    console.log(`\nVersion set to ${version}`)

    // Clean the pascoal crate's build cache after every version bump - the
    // target/ dir grows very large from accumulated incremental debug
    // builds across a dev session, and a fresh version tag is a natural
    // checkpoint to clear it. Best-effort: a failure here (e.g. cargo not
    // on PATH, or a build currently holding a file lock) should not block
    // the version bump itself.
    try {
        console.log('\nCleaning pascoal build cache...')
        execSync('cargo clean -p pascoal', {
            cwd: path.join(root, 'src-tauri'),
            stdio: 'inherit',
        })
    } catch (err) {
        console.warn(`\nWarning: cargo clean -p pascoal failed: ${err.message}`)
        console.warn('You may want to run it manually.')
    }
} else {
    console.error('\nSome files could not be updated.')
    process.exit(1)
}