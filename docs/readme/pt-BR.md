# Pascoal

> Uma IDE Pascal moderna para desktop - escreva, compile e execute programas Pascal.

🌐 [English](../../README.md)

---

## O que é o Pascoal?

O Pascoal é uma IDE Pascal para desktop construída com Tauri e Rust, desenvolvida para trazer a programação Pascal a um público moderno. Interface limpa, compilação real via Free Pascal (FPC) e terminal interativo - tudo em um pacote leve.

Nasceu como uma rebelião contra ferramentas ultrapassadas como o Pascalzim, com o objetivo de tornar Pascal acessível e divertido novamente - sem o peso do Electron ou a bagunça de interfaces legadas.

## Funcionalidades

- **Editor moderno** com Ace Editor e realce de sintaxe Pascal
- **Compilação real** via Free Pascal Compiler (FPC)
- **Terminal interativo** com suporte a stdin/stdout - `readln` funciona
- **Edição em múltiplas abas** - abra vários arquivos simultaneamente
- **Três temas** - Dark, Light e Charcoal, com detecção automática do sistema
- **Controles de janela nativos** adaptados por plataforma (traffic lights no macOS, estilo Windows/Linux)
- **Salvar automaticamente antes de executar** - configurável
- **Leve** - ~25MB de RAM, ~5MB de instalador

## Requisitos

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) >= 22
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) instalado e disponível no PATH
- [Pré-requisitos do Tauri](https://tauri.app/start/prerequisites/) para sua plataforma

## Como começar

```bash
# Clone o repositório
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
cargo tauri dev

# Build para produção
cargo tauri build
```

### Somente frontend (desenvolvimento de UI sem Tauri)

```bash
npm run dev:ide
```

### Executando testes

```bash
npm test              # frontend + Rust
npm run test:frontend # somente Vitest
npm run test:rust     # somente cargo test
```

## Estrutura do projeto

```
src/
  renderer/
    ide/                    # Frontend Svelte + Vite
      src/
        components/         # Componentes Svelte (Titlebar, TabBar, Editor, Terminal...)
        icons/              # Componentes de ícones SVG
        stores/             # Stores Svelte (tabs, theme, terminal, runner, settings)
        styles/             # CSS global
        tests/              # Testes Vitest
      public/
        vendor/             # Ace Editor (ace.js, mode-pascal.js, tema)
src-tauri/
  src/
    lib.rs                  # Comandos Tauri e lógica principal
    tests/                  # Testes unitários Rust
  tauri.conf.json
  Cargo.toml
docs/
  readme/                   # Traduções do README
scripts/
  set-version.cjs           # Script de bump de versão
```

## Stack tecnológica

| | |
|---|---|
| Runtime | Tauri 2 |
| Backend | Rust |
| Frontend | Svelte 5 + Vite + TypeScript |
| Compilador | Free Pascal (FPC) |
| Terminal | xterm.js |
| Editor | Ace Editor |
| Testes | Vitest + cargo test |

## Roadmap

- [ ] Abrir Pasta / Projeto
- [ ] Integração com Git
- [ ] Terminal PTY (PowerShell, bash, fish)
- [ ] Persistência de configurações
- [ ] Modo Playground
- [ ] Modo Desafio com casos de teste
- [ ] CI/CD com GitHub Actions

## Contribuindo

Contribuições são bem-vindas. Sinta-se à vontade para abrir issues ou pull requests.

## Licença

[MIT](../../LICENSE) - Brener Fregulia, 2026