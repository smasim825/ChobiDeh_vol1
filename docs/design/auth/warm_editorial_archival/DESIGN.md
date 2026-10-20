---
name: Warm Editorial Archival
colors:
  surface: '#edfdf9'
  surface-dim: '#cdddda'
  surface-bright: '#edfdf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e7f7f4'
  surface-container: '#e1f1ee'
  surface-container-high: '#dcece8'
  surface-container-highest: '#d6e6e2'
  on-surface: '#101e1c'
  on-surface-variant: '#3e4947'
  inverse-surface: '#253331'
  inverse-on-surface: '#e4f4f1'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#8e4e14'
  on-secondary: '#ffffff'
  secondary-container: '#ffab69'
  on-secondary-container: '#783d01'
  tertiary: '#005e3f'
  on-tertiary: '#ffffff'
  tertiary-container: '#007952'
  on-tertiary-container: '#99ffcd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6f3800'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#edfdf9'
  on-background: '#101e1c'
  surface-variant: '#d6e6e2'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  caption:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-mobile: 0.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system blends the precision of modern intelligent software with the physical warmth of archival memory curation. Designed for collective storytelling and shared photo libraries, the interface rejects cold, utilitarian enterprise aesthetics in favor of a tactile, editorial atmosphere.

### Core Character & Atmosphere
- **Archival Warmth:** Canvas tones drawn from uncoated ivory paper establish an unhurried, comfortable browsing experience that respects photography as memory rather than fleeting content.
- **Intelligent Discretion:** AI interventions are framed as attentive curatorial suggestions rather than intrusive algorithmic disruptions. Confident signals stay grounded; ambiguous suggestions invite thoughtful review.
- **Clarity & Composure:** Restrained contrast, structured layouts, and deliberate whitespace provide gallery-grade breathing room for diverse photographic media.

### Target Audience & Mindset
Built for travelers, families, creative collaborators, and event groups navigating messy camera rolls together. Users seek collaborative resolution over clutter without feeling overwhelmed by technical sorting parameters. The interface feels trustworthy, warm, and natural to both iOS and Android design paradigms.

## Colors

The color system pairs deep mineral pigments with organic paper tones to provide distinct functional tiers across content, chrome, and AI confidence telemetry.

### Palette Architecture
- **Primary (`#0F766E` Deep Teal):** Anchors high-priority actions, active state transitions, selected item boundaries, and confident AI curation states.
- **Secondary (`#F4A261` Travel Orange):** Illuminates moments requiring human curation, spotlighting unverified matches, review prompts, discovery badges, and intelligent sync warnings.
- **Tertiary (`#10B981` Emerald):** Reserved for explicit system successes, completed synchronization confirmations, and high-confidence facial clustering verification.
- **Neutral Primary (`#253331` Dark Charcoal):** Delivers precise typographic structure for titles, headings, and focused data points.
- **Neutral Secondary (`#5C6D6A` Muted Slate):** Handles secondary context, metadata labels, timestamps, and camera technical parameters.
- **Canvas Base (`#F8F5EF` Warm Ivory):** The global foundation for all scrollable views and page backgrounds.
- **Surface Elevation (`#FFFFFF` Crisp White):** Applied to individual cards, bottom sheets, toolbars, and floating interaction trays.
- **Structural Outlines (`#E2DDD4` / `#E6E1D8` Subtle Warm Border):** Defines spatial boundaries without jarring tonal contrast.
- **Status Unsorted (`#64748B` Slate Gray):** Marks unclustered, raw intake photos awaiting background analysis.

### Color Rules
- Maintain pure white surfaces for content cards to ensure true photographic color reproduction; do not tint thumbnail backdrops.
- Restrict Travel Orange to action-oriented curation badges and prompt chips; never use it for wide background fills.

## Typography

Manrope is utilized universally across the hierarchy. Its geometric foundation provides architectural stability in dense grid interfaces, while humanist terminals bring approachability to shared memory albums.

### Typographic Hierarchy & Styling
- **Album & Screen Titles (`display-lg`, `headline-xl`):** Set in 700 and 800 weights with tightened tracking (`-0.03em`) to anchor the top of views and preserve vertical space on compact devices.
- **Subheadings & Album Sections (`headline-md`, `headline-sm`):** Rendered in Semibold (`600`) using Dark Charcoal (`#253331`), organizing groupings such as dates, locations, and member contributions.
- **Narrative & Metadata (`body-lg`, `body-md`):** Designed for high legibility in album captions, image descriptions, and sync status text. Muted Slate (`#5C6D6A`) is reserved for contextual secondary copy.
- **Indicators & AI Tags (`label-md`, `label-sm`):** Rendered in Semibold (`600`) with loose tracking (`+0.02em` to `+0.03em`) to maintain legibility within compact pill badges and confidence tags.

## Layout & Spacing

Layouts prioritize dense media grids paired with breathable structural margins.

### Mobile Grid Principles
- **Photo Canvas Grid:** Built on an adaptable 3-column layout on standard phones (scaling to 4 columns on larger phone displays and 6 on tablets).
- **Inter-Item Gutters:** `gutter-mobile` (`0.5rem` / `8px`) provides tight, cohesive visual rhythm without letting imagery blend together.
- **Canvas Margins:** Fixed `margin` (`1rem` / `16px`) on phone viewports ensures cards and lists float cleanly over the Warm Ivory base.
- **Vertical Spacing Cadence:** Use `space-lg` (`16px`) between logical card groupings and `space-2xl` (`32px`) between major chronological album breaks.

### Layout Flow
- Feed and gallery scrolling must be continuous, pinning utility filter bars to the top and contextual curation controls to an anchored bottom dock.
- Sticky headers use backdrop blurs rather than solid fills to provide continuous spatial orientation during rapid gallery navigation.

## Elevation & Depth

Visual depth is achieved through layered tonal contrasts and soft environmental diffusion rather than heavy dropshadows, honoring the flat, photographic nature of the content.

### Layer Tiers
- **Tier 0 (Base Canvas):** Warm Ivory (`#F8F5EF`) plane hosting all view transitions and passive space.
- **Tier 1 (Surface Cards & Photo Cells):** Crisp White (`#FFFFFF`) with 1px border (`#E6E1D8`) and ambient shadow: `0px 2px 8px rgba(37, 51, 49, 0.04)`.
- **Tier 2 (Floating Action Docks & Menus):** Crisp White (`#FFFFFF`) elevated by dual ambient diffusion: `0px 8px 24px rgba(37, 51, 49, 0.08)` and `0px 2px 6px rgba(37, 51, 49, 0.04)`.
- **Tier 3 (Modals & Full-Screen Image Loupe):** High-opacity frosted backdrops (`rgba(37, 51, 49, 0.6)` with `16px` blur) bringing critical curation tasks forward.

### Glassmorphism Guidelines
Header controls, bottom action bars, and floating AI state chips leverage glassmorphism (`rgba(255, 255, 255, 0.85)` with `12px` blur and a 1px border of `#E2DDD4`) to expose colors of scrolling photos beneath.

## Shapes

The interface embraces organic curvature to soften technical photo sorting parameters and mirror the physical rounded corners of vintage snapshot prints.

### Radii Hierarchy
- **Base Rounding (`rounded-md` / 8px):** Small badges, micro confidence chips, menu tooltips.
- **Interactive Controls (`rounded-lg` / 12px–14px):** Primary/secondary buttons, photo grid thumbnails, text input fields.
- **Cards & Sheets (`rounded-xl` / 16px–18px):** Album overview cards, AI suggestion cards, curation review dialogs.
- **Pill Architecture (`rounded-full` / 9999px):** Avatar rings, floating filter chips, status badges, contextual selection indicators.

## Components

### Buttons
- **Primary Action:** Solid Deep Teal (`#0F766E`) background, Crisp White (`#FFFFFF`) label (`label-lg`), `14px` border radius, `12px 20px` internal padding. Active state scales to `0.98` with `#0D645E`.
- **Secondary Action:** Transparent background, 1.5px solid Warm Border (`#E2DDD4`), Dark Charcoal (`#253331`) label. Active state applies `#F8F5EF`.
- **AI Accent Button:** Travel Orange (`#F4A261`) fill with Dark Charcoal text for urgent review triggers and batch actions.

### Photo Thumbnails & Grid Tiles
- Enclosed with `12px` roundedness. 
- Integrated subtle inner border: `1px solid rgba(0, 0, 0, 0.06)` to retain edge definition on high-key photos.
- Active multi-selection displays a `3px` solid Deep Teal border with an interior `2px` white spacer, accompanied by a check badge in the top-right corner.

### AI Confidence & Privacy Badges
- **Pill Construction:** Full pill border radius (`9999px`), `4px 10px` padding, uppercase `label-sm` font.
- **High Confidence Match:** Background `rgba(15, 118, 110, 0.12)`, text `#0F766E`, featuring a solid micro spark icon.
- **Needs Review / Uncertain:** Background `rgba(244, 162, 97, 0.16)`, text `#B85D19`, accompanied by an alert dot.
- **Unsorted / Raw intake:** Background `rgba(100, 116, 139, 0.12)`, text `#64748B`.
- **Privacy Indicators:** Subtle lock/shared indicator chip in `#253331` with `rgba(255, 255, 255, 0.9)` background, explicitly communicating group visibility levels.

### Cards (Album & Suggested Sets)
- Background `#FFFFFF`, `16px` border radius, `1px solid #E6E1D8`, soft ambient shadow.
- Staggered preview tiles within album cards use consistent `8px` radii with overlapping offsets.

### Form Inputs & Search
- Inputs feature a `#FFFFFF` fill, 1px `#E2DDD4` border, `12px` border radius, and `12px 16px` padding.
- Focused state transitions border to Deep Teal (`#0F766E`) with a soft matching glow: `0 0 0 3px rgba(15, 118, 110, 0.15)`.

### Selection & Curation Floating Dock
- Floating pill-dock pinned `24px` above the bottom screen safe area.
- Crisp White surface (`#FFFFFF`), `9999px` radius, dual drop shadow, containing active selection tallies, instant tag triggers, and share confirmations.