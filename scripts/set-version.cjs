#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const version = process.argv[2]

if (!version) {
    console.error('Usage: node scripts/set-version.js <version>')
    console.error('Example: node scripts/set-version.js 0.9.0')
    process.exit(1)
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('Version must follow semver format: X.Y.Z')
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
} else {
    console.error('\nSome files could not be updated.')
    process.exit(1)
}