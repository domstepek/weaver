# Weaver Design System Foundations (Phase 1)

## Purpose

This document defines the visual foundation for Weaver's UI refresh: dark, high-contrast dashboard surfaces, muted green accents, and dense but readable information layouts.

## Token Conventions

- Components must use semantic token names, not raw color names.
- Allowed examples: `bg-surface`, `text-text-muted`, `border-border-accent`, `bg-accent`.
- Avoid direct gray/blue/yellow palette utilities in component styling.

## Token Families

### Colors

- Canvas: `canvas`, `canvas-muted`
- Surfaces: `surface`, `surface-muted`, `surface-elevated`, `surface-overlay`, `surface-selected`
- Borders: `border`, `border-strong`, `border-accent`
- Text: `text-primary`, `text-secondary`, `text-muted`, `text-inverse`, `text-accent`
- Accent: `accent`, `accent-hover`, `accent-soft`, `accent-contrast`
- Status: `status-success`, `status-warning`, `status-danger`, `status-info`

### Typography

- Primary stack: `IBM Plex Sans`, `Inter`, system sans
- Dense UI stack: `Inter`, `IBM Plex Sans`, system sans
- Mono stack: `IBM Plex Mono`, `SFMono-Regular`, Menlo, monospace
- Scale baseline:
  - Label: 12px
  - Body: 15px
  - Title: 20px
  - Display: 30px

### Layout Rhythm and Shape

- Spacing rhythm uses 4px/8px/12px/16px/20px/24px increments.
- Radius:
  - `radius-sm`: compact controls and code pills
  - `radius-md`: default controls and panels
  - `radius-lg`/`radius-xl`: cards and grouped containers
- Elevation:
  - `shadow-panel`: baseline card depth
  - `shadow-raised`: elevated content
  - `shadow-overlay`: modal and high-priority surfaces

## Surface Rules

- `canvas` is page background only.
- `surface` is primary app panel background.
- `surface-muted` is secondary panel or nested section background.
- `surface-elevated` is used for focal cards and modal bodies.
- `surface-overlay` is used for hover/floating contexts.
- Use borders to separate dense sections before introducing stronger shadows.

## Interaction States

### Buttons and Interactive Chips

- Default: `bg-accent` + `text-accent-contrast`
- Hover: `bg-accent-hover`
- Focus: `ring-accent` with visible ring (`focus-visible`)
- Active: maintain accent tone and increase contrast with border if needed
- Disabled: use `opacity-disabled` and block pointer actions

### Inputs

- Default: `bg-canvas-muted` + `border-border`
- Hover: optional `border-border-strong`
- Focus: `focus:ring-accent` + `focus:border-border-accent`
- Disabled: `opacity-disabled`

### Row Selection (lists, context picks)

- Selected rows: `bg-surface-selected`
- Hover rows: `hover:bg-surface-muted`
- Selected text should remain `text-text-primary`

## Data-Dense Section Guidelines

- Prefer strong hierarchy: section label, primary value, secondary metadata.
- Use muted text for timestamps/help text; primary text for actionable content.
- Preserve compact paddings while keeping tap targets at least 32px high.
- Avoid multiple accent surfaces in the same dense region.

## Storybook Alignment

Storybook documents these foundations in:

- `Design System/Tokens`
- `Design System/Primitives/Surface`
- `Design System/Primitives/Text`
- `Design System/Primitives/Accent`

These stories are the reference for future component implementation.
