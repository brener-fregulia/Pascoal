import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = path.join(__dirname, '../../../scripts/extract-changelog.cjs')

function run(version: string): string {
    return execFileSync('node', [SCRIPT, version], { encoding: 'utf-8' })
}

function exitCode(version: string): number {
    try {
        execFileSync('node', [SCRIPT, version], { stdio: 'pipe' })
        return 0
    } catch (err: any) {
        return typeof err.status === 'number' ? err.status : 1
    }
}

// These run against the real repo CHANGELOG.md rather than a fixture -
// deliberately: the script always resolves the file relative to its own
// location, and a real, non-empty entry for the current version has to
// exist anyway for the release workflow to pass. Testing against a
// disposable fixture would need to fake that (via a CHANGELOG_PATH-style
// override), which isn't worth the extra surface for a script this small.
describe('extract-changelog.cjs', () => {
    it('extracts the section for a version that exists in CHANGELOG.md', () => {
        const output = run('2026.1.1')
        expect(output.trim().length).toBeGreaterThan(0)
        expect(output).toContain('Fixed')
    })

    it('exits with a non-zero code for a version with no entry', () => {
        expect(exitCode('1999.9.9')).not.toBe(0)
    })

    it('exits with a non-zero code when called without a version argument', () => {
        let threw = false
        try {
            execFileSync('node', [SCRIPT], { stdio: 'pipe' })
        } catch {
            threw = true
        }
        expect(threw).toBe(true)
    })
})