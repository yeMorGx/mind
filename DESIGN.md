---
name: Mind
description: Visual system for creator profiles, prompt results, and a private prompt library.
colors:
  background: "#060606"
  foreground: "#ededed"
  input-background: "#1a1a1a"
  input-foreground: "#ffffff"
  border-color: "#333333"
  shell: "#080808"
  node-surface: "#111"
  profile-background: "#fafafa"
  profile-foreground: "#17181a"
  profile-action-hover: "#34343d"
  profile-cover-fallback: "#e9e7f3"
  profile-avatar-fallback: "#ddd9ed"
  profile-media-fallback: "#ebebf0"
  sky-top: "#6ca8da"
  sky-bottom: "#b9ddf3"
  landing-ink: "#102a43"
  landing-action-hover: "#183d5d"
  founder: "#a66805"
  founder-background: "#fff3cc"
  verified: "#1687f8"
  moderator: "#138574"
  creator: "#7857d7"
  partner: "#c55424"
typography:
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "14px"
    lineHeight: "20px"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
  prompt-headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  landing-display:
    fontFamily: "Instrument Serif, serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: "40px"
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "12px"
    lineHeight: "16px"
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  node: "20px"
  avatar-mobile: "28px"
  avatar-desktop: "36px"
  full: "9999px"
spacing:
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-library:
    backgroundColor: "{colors.input-foreground}"
    textColor: "#000000"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-profile:
    backgroundColor: "{colors.profile-foreground}"
    textColor: "{colors.input-foreground}"
    rounded: "{rounded.full}"
    padding: "12px 20px"
  button-profile-hover:
    backgroundColor: "{colors.profile-action-hover}"
  button-landing:
    backgroundColor: "{colors.landing-ink}"
    textColor: "{colors.input-foreground}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  input:
    backgroundColor: "{colors.input-background}"
    textColor: "{colors.input-foreground}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  sidebar:
    backgroundColor: "{colors.shell}"
    width: "80px"
  header:
    backgroundColor: "rgba(8, 8, 8, 0.95)"
    height: "64px"
  library-node:
    backgroundColor: "{colors.node-surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.node}"
    padding: "20px"
  profile-media:
    backgroundColor: "{colors.profile-media-fallback}"
    rounded: "{rounded.2xl}"
---

# Design System: Mind

## Overview

Mind uses two surface themes. The private library, editor, and prompt pages use dark backgrounds, quiet borders, and bright actions. Public creator profiles use a light ground, a cover with an overlapping avatar, and an image-led publication grid. These profile choices follow the supplied visual references.

The accepted landing retains its light animated sky, serif headline, and circular gallery without image titles. Its community section uses the dark theme. Theme choice belongs to each surface; the profile palette is not a global replacement.

**Key Characteristics:**

- Results and creator photography carry the visual emphasis.
- Compact navigation and restrained interface labels support the content.
- Rounded media, fields, and actions recur across both themes.

## Colors

### Primary

Landing ink anchors sky-facing text and actions. Profile foreground anchors the light profile's text and share action. Dark surfaces reverse the action contrast with white buttons.

### Secondary

Badge colors communicate specific assigned identities: gold founder, blue verified account, green moderator, violet content creator, and copper sponsored partner. They are not general action colors.

### Neutral

Global background, foreground, input, and border tokens come from `app/globals.css`. Shell and node surfaces provide subtle dark separation. Profile background remains light; pale violet cover/avatar fallbacks and pale media placeholders support missing images.

## Typography

Geist is the interface family, supplied through the root `--font-sans` variable. Instrument Serif is confined to the landing display and community heading. Prompt source text uses the platform monospace stack.

Body copy and controls commonly use the body role; metadata uses the label role. Library/editor titles use the title role. Profile names grow from the title role to 36px at the small breakpoint. Prompt headlines grow from 36px to 48px there. Longer profile names wrap; grid titles truncate. Landing requests a bold display treatment while loading Instrument Serif's available 400 face.

## Layout

The library's icon sidebar is fixed and 80px wide from the medium breakpoint. Its 64px header is fixed, offset by the sidebar on desktop, and spans the viewport on mobile. Content begins with 96px top padding in a centered 1152px container. There is no library hero. Mobile navigation opens an overlay drawer with labeled icon controls.

The profile uses a centered 1280px container with 20px mobile and 32px larger gutters. The cover grows from 176px to 240px and then 288px. The avatar grows from 112px to 176px and overlaps the cover by 56px/80px. The publication grid moves from one to two to three columns at the small and large breakpoints; media retains a 4:3 ratio.

Prompt content uses a centered 1152px container. The creator lanyard sits inside the “Conheça o criador” card beneath the results and prompt text, with a shell capped at 224px wide and a 260px scene. It stays in the document flow on desktop and mobile, with no reserved sidebar space. Creator, details, and usage cards follow the main content.

## Elevation & Depth

Most interface depth comes from tonal layers, thin borders, and image clipping. The home header uses backdrop blur. The landing's sky/gallery and prompt's Three.js lanyard provide dimensional motion; conventional cards remain restrained. Image comparison uses a small shadow beneath its grip and a glow along its divider. These local effects are not a universal card shadow.

## Shapes

Fields and common library buttons use the xl radius; media and content panels use 2xl. Action nodes use the larger node radius. Profile avatars are rounded squares with a thick border matching the profile ground. Profile share actions, categories, and badge labels use pill shapes.

## Components

- **Buttons:** dark library/prompt actions are white; the light profile action is dark; sky actions use landing ink. Hover changes tone. Profile/landing actions have visible outline focus. Preserve each source component's states when extending it.
- **Fields:** dark inputs use local background and border treatments; the header search has a leading search icon and a stronger border on focus. Profile uploads preview optimized JPEG, PNG, or WebP data URLs.
- **Navigation:** icon controls have accessible names and titles, a bright active state, and muted resting icons. The mobile menu opens the compact sidebar over a dimmed backdrop.
- **Library nodes:** compact text cards expose copy, edit, favorite, and duplicate actions in an animated fan anchored to their corner. Publication and deletion actions remain within the card.
- **Profile cards:** images lead, followed by a title and category/model metadata. Missing images show a text preview. Hover scales images slightly; reduced motion removes this transition.
- **Badges:** Google Material Symbols Rounded SVG masks render colored identity icons. The founder crown also carries its label by default; other labels appear in the labeled variant. Assignment belongs exclusively to administrators.
- **Creator lanyard:** a client-loaded Three.js badge uses the real profile photo/name, gold hardware for the founder, and silver otherwise. A photo/initial fallback and creator link remain when rendering is unavailable. Clicking the badge opens the creator profile.
- **Results:** the image loop pauses for keyboard browsing and reduced motion; a lightbox supports inspection. Before/after imagery uses an interactive divider.

## Do's and Don'ts

### Do:

- **Do** retain the accepted sky landing and use the light profile theme on public creator profiles.
- **Do** keep the library and prompt surfaces dark with their existing content hierarchy.
- **Do** use genuine profile and prompt images, wrap long names, and provide useful missing-image states.
- **Do** preserve accessible control labels, visible focus, and existing reduced-motion behavior.

### Don't:

- **Don't** turn profile colors into a universal site theme.
- **Don't** add invented follower, like, or sales metrics to creator identity.
- **Don't** offer self-assigned verification or founder badges.
- **Don't** treat illustrative review fixtures as shipped creator content.
