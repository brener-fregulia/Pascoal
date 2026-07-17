# Pascoal

> Uma IDE moderna de Pascal para desktop — escreva, compile e execute programas em Pascal.

[English](../../README.md) · [Español (Latinoamérica)](es-419.md) · [Polski](pl.md)

---

## O que é o Pascoal?

Pascoal é uma IDE desktop para Pascal desenvolvida com Tauri e Rust, criada para levar a programação em Pascal a um público moderno. Interface limpa, compilação real via Free Pascal (FPC), console interativo para programas, explorador de arquivos, busca entre arquivos e integração com Git — tudo em um pacote leve.

Ele nasceu como uma rebelião contra ferramentas ultrapassadas como o Pascalzim, com o objetivo de tornar Pascal acessível e divertido novamente — sem o peso do Electron nem a bagunça de interfaces legadas.

## Funcionalidades

* **Editor moderno** com CodeMirror 6, destaque de sintaxe para Pascal e temas reativos
* **Compilação real** via Free Pascal Compiler (FPC)
* **Console interativo** com áreas separadas para build e saída do programa — `readln` funciona
* **Edição em múltiplas abas** — abra vários arquivos simultaneamente
* **Explorador de arquivos** — abra uma pasta e navegue pelos seus arquivos Pascal
* **Buscar e substituir** — widget flutuante no estilo VSCode com destaque de ocorrências, além de busca entre arquivos em uma pasta aberta
* **Integração com Git** — visualize status, faça stage/unstage, inspecione diffs, crie commits e inicialize repositórios, tudo em um painel dedicado
* **Menu nativo do sistema** — menus Arquivo e Ajuda integrados à barra de título, com links diretos para reportar bugs ou solicitar funcionalidades no GitHub
* **Três temas** — Escuro, Claro e Charcoal, com detecção do sistema
* **Controles nativos de janela** adaptados por plataforma (traffic lights no macOS, estilo Windows/Linux)
* **Salvamento automático antes de executar** — configurável
* **Interface internacionalizada** — English, Português (BR), Español (Latinoamérica) e Polski, com persistência da seleção de idioma
* **Leve** — ~25 MB de RAM, instaladores de ~5 MB

## Requisitos

* [Rust](https://rustup.rs/) (stable)
* [Node.js](https://nodejs.org/) >= 22
* [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) instalado e disponível no PATH
* [Git](https://git-scm.com/) instalado e disponível no PATH (necessário para o painel Git)
* [Pré-requisitos do Tauri](https://tauri.app/start/prerequisites/) para a sua plataforma

## Primeiros passos

```bash
# Clonar o repositório
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal

# Instalar dependências
npm install

# Executar em modo de desenvolvimento
cargo tauri dev

# Gerar build de produção
cargo tauri build
```

### Apenas frontend (desenvolvimento de UI sem Tauri)

```bash
npm run dev:ide
```

### Dicas de desenvolvimento

Para acelerar os rebuilds do Rust durante o desenvolvimento, instale o [sccache](https://github.com/mozilla/sccache):

```bash
cargo install sccache
```

Depois, defina-o como wrapper do compilador Rust em `src-tauri/.cargo/config.toml`:

```toml
[build]
rustc-wrapper = "sccache"
```

Isso também é usado no CI para acelerar builds nos runners do GitHub Actions.

### Executando os testes

```bash
npm test              # frontend + Rust + Pascal
npm run test:frontend # apenas Vitest
npm run test:rust     # apenas cargo test
npm run test:pascal   # testes de integração em Pascal (requer FPC)
```

## Estrutura do projeto

```text
src/
  renderer/
    ide/                    # Frontend em Svelte + Vite
      src/
        components/         # Componentes Svelte (Titlebar, TabBar, Editor, Console, FileTree, SearchPanel, GitPanel, FindWidget, AboutModal...)
        icons/              # Componentes de ícones SVG
        stores/             # Stores do Svelte (tabs, theme, console, runner, settings, explorerStore, searchStore, gitStore...)
        i18n/               # Arquivos de locale e store de traduções
        styles/             # CSS global
src-tauri/
  src/
    lib.rs                  # Configuração do app e registro de comandos
    env.rs                  # Detecção do FPC e diretório de documentos
    fs.rs                   # Comandos de I/O de arquivos, explorador de pastas e busca entre arquivos
    git.rs                  # Comandos de status, stage, diff, commit e init do Git
    compiler.rs             # Lógica de compilação com FPC
    installer.rs            # Detecção do gerenciador de pacotes do FPC e instalação guiada
    process.rs              # Estado de processos, run_with_pipes, run_with_pty
    tests/                  # Testes unitários em Rust
  tauri.conf.json
  Cargo.toml
tests/
  frontend/                 # Testes com Vitest
  pascal/                   # Testes de integração em Pascal e scripts
docs/
  readme/                   # Traduções do README
scripts/
  set-version.cjs           # Script de bump de versão
```

## Stack de tecnologias

|                    |                              |
| ------------------ | ---------------------------- |
| Runtime            | Tauri 2                      |
| Backend            | Rust                         |
| Frontend           | Svelte 5 + Vite + TypeScript |
| Compilador         | Free Pascal (FPC)            |
| Editor             | CodeMirror 6                 |
| Console            | xterm.js                     |
| Controle de versão | Git (via CLI)                |
| Testes             | Vitest + cargo test          |

## Roadmap

* [x] Arquivos recentes (tela de boas-vindas)
* [x] Abrir pasta / projeto
* [x] Integração com Git
* [x] Buscar e substituir, busca entre arquivos
* [x] CI/CD com GitHub Actions
* [ ] Instalador guiado do FPC (instalação automática via winget/apt/pacman/dnf/zypper)
* [ ] Terminal PTY (PowerShell, bash, fish)
* [ ] Janela de terminal destacada para executar programas em Pascal
* [ ] Persistência de configurações (tamanho da fonte do editor, posição do console)
* [ ] Gramática Pascal com Tree-sitter (syntax highlighting completo, guias de indentação, outline de código)
* [ ] Modo Playground
* [ ] Modo Challenge com casos de teste

## Contribuindo

Contribuições são bem-vindas. Sinta-se à vontade para abrir issues ou pull requests. Relatos de bugs e solicitações de funcionalidades usam [GitHub Issue Forms](.github/ISSUE_TEMPLATE/) estruturados — disponíveis diretamente pelo menu Ajuda do app.

## Licença

[MIT](../../LICENSE) - Brener Fregulia, 2026
