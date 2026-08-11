# Pascoal

> Uma IDE moderna de Pascal para desktop - escreva, compile e execute programas Pascal.

[English](../../README.md) · [Español (Latinoamérica)](es-419.md) · [Polski](pl.md)

---

## O que é o Pascoal?

Pascoal é uma IDE leve de Pascal para desktop, construída com Tauri, Rust, Svelte,
TypeScript e CodeMirror.

O foco é oferecer uma interface moderna, compilação real com Free Pascal,
execução interativa de programas, navegação de projetos e uma experiência de
desenvolvimento adequada tanto para estudantes quanto para desenvolvedores
Pascal.

## Download

Baixe a versão mais recente na
[página de Releases](https://github.com/brener-fregulia/Pascoal/releases/latest).

- **Windows** - `Pascoal_x.x.x_x64-setup.exe`
- **Linux** - `.deb`, `.rpm` ou `.AppImage`

> **Windows SmartScreen:** o Pascoal ainda não possui assinatura de código, então
> o Windows pode exibir um aviso do SmartScreen na primeira execução.

## Funcionalidades

- Editor CodeMirror 6 com realce estrutural de Pascal baseado em Tree-sitter
- Integração com o Free Pascal Compiler (FPC)
- Console interativo de programas com suporte a `readln`
- Edição em múltiplas abas
- Explorador de arquivos com operações de arquivos e pastas
- Localizar/substituir e busca entre arquivos
- Instalação guiada do FPC
- Atualizações automáticas do aplicativo
- Notas de versão e histórico de versões dentro do aplicativo
- Menus Arquivo, Editar e Ajuda no estilo nativo
- Configurações de aparência, idioma, identidade Git e status do toolchain
- Temas Dark, Light e Charcoal
- Interface em English, Português (BR), Español (Latinoamérica) e Polski
- Suporte a Windows e Linux

## Requisitos

Para desenvolvimento:

- [Rust](https://rustup.rs/) stable
- [Node.js](https://nodejs.org/) 22 ou mais recente
- [Pré-requisitos do Tauri](https://tauri.app/start/prerequisites/) para a sua plataforma

O FPC não precisa estar instalado previamente para uso normal; o Pascoal pode
detectar a ausência do compilador e orientar sua instalação.

## Como começar

```bash
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal
npm install
cargo tauri dev
```

Build de produção:

```bash
cargo tauri build
```

Desenvolvimento somente do frontend:

```bash
npm run dev:ide
```

## Testes

```bash
npm test
npm run test:frontend
npm run test:rust
npm run test:pascal
```

Consulte [Testes](../development/testing.md) para a política completa de testes.

## Desenvolvimento

O Pascoal usa contratos explícitos de arquitetura e um fluxo de
Spec-Driven Development.

- [Arquitetura](../architecture/README.md)
- [Decisões arquiteturais](../decisions/README.md)
- [Spec-Driven Development](../development/sdd.md)
- [Fluxo de desenvolvimento](../development/workflow.md)
- [Testes](../development/testing.md)
- [Processo de release](../development/release-process.md)
- [Política de documentação](../development/documentation-policy.md)
- [Changelog](../../CHANGELOG.md)
- [Projeto Pascoal Development](https://github.com/users/brener-fregulia/projects/3)

As regras do repositório específicas para agents são definidas em
[AGENTS.md](../../AGENTS.md).

## Stack tecnológica

| | |
|---|---|
| Runtime | Tauri 2 |
| Backend | Rust |
| Frontend | Svelte 5 + Vite + TypeScript |
| Compilador | Free Pascal (FPC) |
| Editor | CodeMirror 6 |
| Console | xterm.js |
| Controle de versão | Git |
| Testes | Vitest + cargo test |

## Contribuindo

Contribuições são bem-vindas. Relatos de bugs e solicitações de funcionalidades
podem ser abertos nas
[Issues do GitHub](https://github.com/brener-fregulia/Pascoal/issues).

O trabalho de desenvolvimento deve seguir a documentação do repositório e os
contratos de arquitetura vinculados acima.

## Licença

[MIT](../../LICENSE) - Brener Fregulia, 2026
