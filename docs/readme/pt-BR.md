# Pascoal

> Um playground Pascal moderno para desktop - escreva, compile e execute programas Pascal com estilo.

🌐 [English](../../README.md)

---

## O que é o Pascoal?

Pascoal é uma IDE Pascal desktop construída com Electron, projetada para trazer a programação Pascal a um público moderno. Interface limpa, compilação real via Free Pascal (FPC) e terminal interativo — tudo em um só lugar.

Nasceu como uma rebeldia contra ferramentas ultrapassadas como o Pascalzim, com o objetivo de tornar o Pascal acessível e divertido novamente.

## Funcionalidades

- **Editor moderno** com Ace Editor e highlight de sintaxe Pascal
- **Compilação real** via Free Pascal Compiler (FPC)
- **Terminal interativo** com suporte a TTY via node-pty
- **Multiplataforma** — Windows e Linux (macOS planejado)
- **Controles de janela nativos** adaptados por plataforma (semáforos no macOS, estilo Windows/Linux)
- **Suporte a i18n** — Português (BR) e Inglês incluídos
- **Tema escuro** com estética limpa e minimalista

## Requisitos

- [Node.js](https://nodejs.org/) >= 22.12.0
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) instalado e disponível no PATH

## Como começar

```bash
# Clone o repositório
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal

# Instale as dependências
npm install

# Execute em modo de desenvolvimento (abre DevTools automaticamente)
npm run dev

# Execute normalmente
npm start
```

## Estrutura do projeto

```
src/
  main/
    constants.js        # Fonte única da verdade para constantes do app
    fpc.js              # Deteccao do FPC e prompts de instalacao
    preload.js          # Context bridge do Electron
    main.js             # Ponto de entrada do app
    handlers/           # Handlers IPC (app, atividades, compilador, janela)
    i18n/               # Traducoes do main process (dialogos nativos)
  renderer/
    index.html
    css/                # Estilos por componente
    js/                 # Scripts do renderer
    partials/           # Templates HTML renderizados via Mustache
    i18n/               # Traducoes do renderer (pt-BR, en-US)
docs/
  readme/               # Traducoes deste README
```

## Stack

| | |
|---|---|
| Runtime | Electron 42 |
| Compilador | Free Pascal (FPC) |
| Terminal | node-pty |
| Editor | Ace Editor |
| Templates | Mustache |

## Contribuindo

Contribuições são bem-vindas. Fique à vontade para abrir issues ou pull requests.

## Licença

[MIT](../../LICENSE) — Brener Fregulia, 2026
