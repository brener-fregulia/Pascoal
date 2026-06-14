const pkg = require(require('path').join(__dirname, '../../package.json'))

module.exports = {
  // Identidade do app
  APP_NAME: pkg.productName,
  APP_VERSION: pkg.version,
  APP_DESCRIPTION: pkg.description,
  APP_AUTHOR: pkg.author,
  IS_DEV: process.env.NODE_ENV === 'development',

  // Diretórios
  ACTIVITIES_DIR: 'atividades',
  SOLUTIONS_DIR: 'solucoes',
  TMP_DIR_NAME: 'pascoal-tmp',
  SRC_FILENAME: 'programa.pas',
  EXE_FILENAME: 'programa',

  // Compilador
  FPC_BIN_WIN: 'fpc.exe',
  FPC_BIN_UNIX: 'fpc',
  FPC_URLS: {
    win32: 'https://sourceforge.net/projects/freepascal/files/Win32/3.2.2/fpc-3.2.2.i386-win32.exe/download',
    linux: 'https://sourceforge.net/projects/freepascal/files/Linux/3.2.2/fpc-3.2.2.x86_64-linux.tar',
    darwin: 'https://sourceforge.net/projects/freepascal/files/Mac%20OS%20X/3.2.2/fpc-3.2.2.intel-macosx.dmg/download'
  },

  // PTY
  PTY_TERM: 'xterm-color',
  PTY_COLS: 80,
  PTY_ROWS: 24,

  // UI
  WIN_MIN_WIDTH: 900,
  WIN_MIN_HEIGHT: 600,
  WIN_DEFAULT_W: 1920,
  WIN_DEFAULT_H: 1080,
  WIN_BG_COLOR: '#0D0D0D',

  // Misc
  RUN_EXIT_DELAY_MS: 100,
}