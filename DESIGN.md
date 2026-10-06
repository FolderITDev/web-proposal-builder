---
name: Proposal Builder
description: Guilloché Dial — a proposal treated as a precision instrument.
colors:
  dial: '#eef0f3'
  surface: '#f7f8fa'
  raised: '#ffffff'
  sunk: '#e3e7ec'
  ink: '#1c2a44'
  ink-hover: '#2a3b5c'
  ink-2: '#465266'
  ink-3: '#5c6779'
  steel: '#808a99'
  rule: '#d5d9df'
  brass: '#9a7b46'
  focus: '#2c4a7a'
  danger: '#a3322b'
  danger-soft: '#f8eceb'
typography:
  display:
    fontFamily: 'Source Serif 4 Variable, Georgia, serif'
    fontSize: 'clamp(2.75rem, 1.6rem + 4vw, 4.5rem)'
    fontWeight: 300
    lineHeight: 1.04
    letterSpacing: '-0.02em'
  title:
    fontFamily: 'Source Serif 4 Variable, Georgia, serif'
    fontSize: 'clamp(2rem, 1.5rem + 1.8vw, 3rem)'
    fontWeight: 330
    lineHeight: 1.08
    letterSpacing: '-0.015em'
  heading:
    fontFamily: 'Source Serif 4 Variable, Georgia, serif'
    fontSize: '1.375rem'
    fontWeight: 400
    lineHeight: 1.25
  lead:
    fontFamily: 'Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)'
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: 'Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 400
    lineHeight: 1.6
  section-heading:
    fontFamily: 'Source Serif 4 Variable, Georgia, serif'
    fontSize: '1.5rem'
    fontWeight: 380
    lineHeight: 1.25
  output-heading:
    fontFamily: 'Source Serif 4 Variable, Georgia, serif'
    fontSize: '1.625rem'
    fontWeight: 350
    lineHeight: 1.2
  total:
    fontFamily: 'Source Serif 4 Variable, Georgia, serif'
    fontSize: '1.25rem'
    fontWeight: 450
    lineHeight: 1.2
  document-heading:
    fontFamily: 'Source Serif 4 Variable, Georgia, serif'
    fontSize: '1.125rem'
    fontWeight: 450
    lineHeight: 1.3
  small:
    fontFamily: 'Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: 'Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: 'Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.4
  index:
    fontFamily: 'Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 560
    lineHeight: 1.3
    letterSpacing: '0.12em'
rounded:
  sm: '3px'
  md: '6px'
spacing:
  gutter-mobile: '20px'
  gutter: '32px'
  section: '112px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.raised}'
    rounded: '{rounded.sm}'
    height: '44px'
    padding: '0 20px'
  button-primary-hover:
    backgroundColor: '{colors.ink-hover}'
  button-secondary:
    textColor: '{colors.ink}'
    rounded: '{rounded.sm}'
    height: '44px'
    padding: '0 20px'
  input:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.ink}'
    rounded: '{rounded.sm}'
    height: '44px'
    padding: '0 14px'
---

# Proposal Builder design system

## Overview

**Creative North Star: "The watch dial."** A fine dial is quiet at a glance and exact on inspection: an opaline ground, engine-turned texture you only notice up close, applied indices, sub-dials that read one value each, and a single warm metal accent. Proposal Builder borrows that discipline. The proposal is the hero; the instrument around it is calm.

**Key Characteristics:**

- Opaline dial ground, midnight ink, brushed-steel hairlines and one brass index.
- Source Serif 4 at light weights for display, titles and the document; Hanken Grotesk for the interface and every figure.
- Tone-on-tone guilloché texture, visible only up close.
- The sub-dial: a hundred applied indices around a total.
- Paper-white document sheets with a soft two-layer shadow; no other elevation.

## Colors

Restrained strategy: cool neutrals, midnight as the working color, brass for one detail per view. Light only: proposals are written at a desk in daylight and read as printed documents.

### Primary

- **Midnight** `ink` `#1c2a44` (12.6:1 on dial): text, primary buttons, active tabs, the major dial indices and the filled dial segment. Hover `ink-hover` `#2a3b5c`.

### Accent

- **Brass** `#9a7b46`: the dial's twelve o'clock index, the "sent" status dot, the active navigation underline and the section rules on the landing page. Graphics only (3.47:1); never text.

### Neutral

- **Dial** `#eef0f3` page ground; **Surface** `#f7f8fa` alternating bands and footers; **Raised** `#ffffff` document sheets, fields and cards; **Sunk** `#e3e7ec` hover fills, tracks and skeletons.
- **Ink 2** `#465266` (6.9:1) secondary text; **Ink 3** `#5c6779` (5.0:1) metadata.
- **Steel** `#808a99` (3.06:1 on dial, 3.49:1 on raised) field borders, switches and minor indices; **Rule** `#d5d9df` hairlines.
- **Danger** `#a3322b` on **danger soft** `#f8eceb`: errors, expired proposals and destructive actions.

### Named Rules

**The One Brass Rule.** Brass marks one thing per view. Adding brass to text, buttons or backgrounds breaks the dial.

**The Brand Belongs to the Document Rule.** The author's brand color appears only inside the proposal sheet and PDF (logo and title rule). The application chrome never takes it on.

## Typography

### Hierarchy

| Role           | Face           | Size                                    | Weight  | Use                                        |
| -------------- | -------------- | --------------------------------------- | ------- | ------------------------------------------ |
| Display        | Source Serif 4 | `text-display`                          | 300     | Landing headline                           |
| Title          | Source Serif 4 | `text-title`                            | 330     | Page titles, landing sections              |
| Document title | Source Serif 4 | clamp(1.625rem, 1.3rem + 1vw, 2.125rem) | 330     | Proposal sheet                             |
| Heading        | Source Serif 4 | 1.125–1.5rem                            | 380–450 | Editor and document sections               |
| Body           | Hanken Grotesk | 0.875–1rem                              | 400     | Everything else                            |
| Index          | Hanken Grotesk | 0.6875rem, +0.12em, uppercase           | 560     | Proposal numbers, table heads, dial labels |

All figures use tabular numerals (`font-variant-numeric: tabular-nums` on `body`), so amounts align in tables and totals.

### Named Rules

**The Serif Is for Reading Rule.** Serif sets titles and documents. Controls, labels, tables and numbers are always sans.

**The Code, Not the Symbol Rule.** Money is written with its ISO code (`USD 7,500.00`); five supported currencies use `$`.

## Layout

- Public pages: 88rem max width; tool: 100rem. Gutter 20 px on phones, 32 px from `sm`.
- Sections are separated by full-width rules (ink for major breaks) and 80–112 px of space; alternating sections use the `surface` band.
- The editor is two equal columns from `lg`: form left, sticky preview right. On phones an **Edit / Preview** switch replaces the split.
- Lists in the editor are bordered cards of fields (one per scope item, service or milestone); the rest of the interface uses ruled rows.
- Tables keep the first column readable on phones by moving secondary columns into the first cell.

## Elevation & Depth

Flat chrome. Document sheets and floating instrument cards use `--shadow-sheet`: `0 1px 2px rgb(28 42 68 / 0.06), 0 12px 32px -12px rgb(28 42 68 / 0.18)`. Nothing else casts a shadow. Focus is a 2 px `focus` outline, or a 3 px halo on fields.

## Shapes

3 px corners on controls, 6 px on cards and sheets. Circles are reserved for the dial, status dots, switches and color swatches.

## Components

### Buttons

- **Primary:** midnight fill, white label, 44 px (36 px small), trailing icon; hover `ink-hover`; press scales to 0.97 in 150 ms.
- **Secondary:** 1 px ink border on transparent; hover fills raised white.
- **Quiet:** text only, `sunk` on hover. **Danger:** danger outline, after an inline confirmation.

### Inputs / Fields

`Field` provides the label, the Optional marker, a hint and the error, wired with `aria-describedby`. Money inputs edit minor units as decimals and reformat on blur; percent inputs edit basis points as percentages; quantities accept two decimals. Errors appear as the person types and the autosave indicator counts them.

### Navigation

Public header with the dial wordmark, links and **Open the builder**. Tool header with **Proposals** and **API**; the current item has a 2 px brass underline. Inside the editor, a sticky row of section links.

### Sub-dial (signature)

`SubDial`: a white disc with a hundred indices (every tenth in ink), a track of segments in decreasing ink opacity, a brass index at twelve and the value at the center in serif. Segment changes are CSS transitions of `stroke-dasharray` (500 ms, ease-out). The legend below lists every segment in words; a visually hidden caption summarizes it.

### Guilloché

`Guilloche`: interlaced rings of `r(θ) = R + A·sin(kθ + φ)` drawn as SVG paths in `currentColor` at 7% opacity behind the landing hero. It is texture, never a background for text.

### Proposal sheet

`ProposalSheet`: the client-facing document on raised white: brand mark and name, proposal number and validity, serif title with a short rule in the brand color, parties, project, scope (with a "Not included" panel), investment table, totals, payment schedule and terms. The PDF mirrors it section for section.

### Status

`StatusBadge`: a word with a mark: an open steel ring for draft, a brass dot for sent, a check for accepted, a dash and muted text for declined.

## Do's and Don'ts

### Do:

- Do keep the proposal sheet the largest, brightest thing on screen.
- Do write every amount with its currency code and tabular figures.
- Do show save state in words next to a small dot: Saved, Unsaved changes, Saving, Fix 2 fields to save, Changed elsewhere.
- Do animate only state changes (dial segments, switches, disclosure), with `cubic-bezier(0.23, 1, 0.32, 1)` and under 500 ms.
- Do design read-only and conflict states as carefully as the editable one.

### Don't:

- Don't use brass for text or more than one element per view.
- Don't put the author's brand color in the application chrome.
- Don't add gradients, glass, blur or decorative imagery; the guilloché is the only texture.
- Don't put a small label or eyebrow above a heading.
- Don't use the serif for controls, tables or numbers in the interface.
