export const config: WebdriverIO.Config = {
    specs: ['./e2e/specs/**/*.e2e.ts'],
    maxInstances: 1,
    logLevel: 'info',
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        // Higher than the usual default (60s) because of a known upstream
        // issue - see the comment on `services` below. Each WebDriver
        // command currently pays a ~5s tax from a failing internal
        // window-focus check in @wdio/tauri-service, so a spec touching
        // several elements can genuinely take minutes even though nothing
        // is actually broken.
        timeout: 180000,
    },
    reporters: ['spec'],
    capabilities: [
        {
            browserName: 'tauri',
        },
    ],
    // KNOWN ISSUE (2026): every WebDriver command currently pays a ~5s
    // penalty from a failing internal check - logs show repeated
    // "Failed to get window states: Error: Tauri core.invoke not
    // available after 5s timeout" from ensureActiveWindowFocus, on every
    // single command. Tests still pass correctly (it's a WARN, not a
    // hard failure), just slowly - a simple flow can take 1-3+ minutes.
    // Confirmed NOT caused by: missing capability permission (added
    // wdio-webdriver:default to capabilities/default.json, no change),
    // wrong locale (fixed separately via the `before` hook below).
    // Root cause not found - likely a bug in this very new package
    // (@wdio/tauri-service / tauri-plugin-wdio-webdriver both only
    // recently reached 1.2.0 stable; two other real bugs were already
    // found and fixed during initial setup). Revisit when picking E2E
    // back up - check for a newer package version or an upstream fix
    // first before debugging further.
    services: [
        [
            'tauri',
            {
                appBinaryPath:
                    process.platform === 'win32'
                        ? './src-tauri/target/debug/pascoal.exe'
                        : './src-tauri/target/debug/pascoal',
                driverProvider: 'embedded',
            },
        ],
    ],
    // Pascoal detects the OS locale on first load (i18n/index.ts checks
    // localStorage['pascoal-locale'] first, falling back to
    // navigator.languages). Specs assume English text - without this,
    // they'd only pass on machines whose OS locale happens to be English,
    // and silently render the wrong labels (Portuguese, in this case)
    // everywhere else.
    before: async function () {
        await browser.execute(() => {
            localStorage.setItem('pascoal-locale', 'en')
        })
        await browser.refresh()
        await browser.pause(500)
    },
}