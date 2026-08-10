# Pascoal Architecture

## Purpose

This directory documents the current technical architecture of Pascoal.

Architecture documentation explains how the system works now: major layers,
responsibilities, boundaries, data flows, and platform integration.

Historical reasoning belongs in `docs/decisions/`. Planned work belongs in
GitHub Issues and Projects.

## Source of truth

The implementation is the ultimate source of truth for current behavior.

Before creating or updating architecture documentation:

- inspect the current implementation;
- verify referenced paths and abstractions;
- distinguish implemented behavior from planned work;
- report conflicts instead of guessing.

Architecture documentation must describe validated reality, not intended future
architecture.

## Scope

Use this directory for topics such as:

- application layers and responsibility boundaries;
- frontend and Tauri/Rust backend integration;
- editor architecture;
- Pascal language tooling;
- project and workspace architecture;
- Git and toolchain integration;
- settings and persistence;
- important shared state and data flows;
- platform-specific integration.

Do not create one document per source directory by default. Add a dedicated
document only when a subsystem is large enough to benefit from independent
maintenance.

## Current architectural constraints

Repository policy already establishes that:

- Pascoal targets Windows and Linux;
- operating-system, filesystem, process, Git, and toolchain responsibilities
  normally belong in the Tauri/Rust backend;
- established boundaries and patterns should be extended rather than bypassed;
- new modules, services, stores, commands, directories, or dependencies require
  a current requirement and an appropriate architectural responsibility.

More specific constraints should be documented only after they are verified in
the implementation or recorded in an accepted ADR.

## Relationship with ADRs

Architecture documentation answers:

> How does Pascoal work now?

An ADR answers:

> Why was a significant approach chosen, what alternatives were considered, and
> what constraints resulted from that decision?

Architecture documents should link to relevant ADRs when useful.

## Updating architecture documentation

Update this documentation when validated work:

- creates, removes, or substantially changes a responsibility boundary;
- changes ownership between layers;
- changes an important data flow;
- introduces or replaces a major subsystem;
- changes platform integration in an architecturally relevant way.

Routine implementation and small refactors that preserve responsibilities do not
normally require architecture documentation changes.

## Validation

Before completing an architecture documentation change:

1. inspect the current implementation;
2. verify referenced paths and abstractions;
3. verify described responsibilities and boundaries;
4. check relevant ADRs;
5. ensure planned behavior is not presented as current behavior.
