export const config: WebdriverIO.Config = {
    specs: ['./e2e/specs/**/*.e2e.ts'],
    maxInstances: 1,
    capabilities: [
        {
            browserName: 'tauri',
        },
    ],
    logLevel: 'info',
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },
    reporters: ['spec'],
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
}