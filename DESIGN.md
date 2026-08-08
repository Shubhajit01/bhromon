---
name: Bhromon
description: A calm, nature-led interface for shaping a journey that feels personal.
colors:
  primary: '#432dd7'
  primary-foreground: '#eef2ff'
  background: '#ffffff'
  foreground: '#090b0c'
  secondary: '#f4f4f5'
  secondary-foreground: '#18181b'
  muted: '#f1f3f3'
  muted-foreground: '#67787c'
  accent-foreground: '#161b1d'
  destructive: '#e7000b'
  border: '#e3e7e8'
  ring: '#9ca8ab'
  logo-blue: '#3754fa'
typography:
  display:
    fontFamily: 'Merriweather Variable, Georgia, serif'
    fontSize: '48px'
    fontWeight: 100
    lineHeight: 1.25
    letterSpacing: 'normal'
  headline:
    fontFamily: 'Geist Variable, Arial, sans-serif'
    fontSize: '30px'
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Geist Variable, Arial, sans-serif'
    fontSize: '20px'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'Geist Variable, Arial, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 'normal'
  label:
    fontFamily: 'Geist Variable, Arial, sans-serif'
    fontSize: '14px'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 'normal'
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
  2xl: '18px'
  3xl: '22px'
  4xl: '26px'
  full: '9999px'
spacing:
  1: '4px'
  2: '8px'
  3: '12px'
  4: '16px'
  6: '24px'
  8: '32px'
  12: '48px'
  16: '64px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.4xl}'
    padding: '0 12px'
    height: '36px'
  button-outline:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.4xl}'
    padding: '0 12px'
    height: '36px'
  prompt-paper:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    typography: '{typography.body}'
    rounded: '{rounded.3xl}'
    padding: '16px 20px'
    height: '154px'
    width: '100%'
  prompt-workspace:
    backgroundColor: '{colors.muted}'
    textColor: '{colors.foreground}'
    typography: '{typography.body}'
    rounded: '{rounded.3xl}'
    padding: '16px 20px'
    height: '154px'
    width: '100%'
  trip-card:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.2xl}'
    padding: '14px 16px'
    width: '100%'
  filter-pill:
    backgroundColor: '{colors.muted}'
    textColor: '{colors.foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.3xl}'
    padding: '0 12px'
    height: '32px'
  user-message:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.secondary-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.3xl}'
    padding: '10px 14px'
    width: '80%'
  guest-banner:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.body}'
    rounded: '0'
    padding: '10px 24px'
    width: '100%'
---

# Design System: Bhromon

## 1. Overview

**Creative North Star: "The Quiet Trailhead"**

Bhromon should feel like arriving at the beginning of a well-considered journey: open, calm, and full of possibility, with enough guidance to make the next step obvious. The interface is nature-led and quietly optimistic. It creates anticipation through real landscape imagery and warm, personal language, then recedes when the traveller begins making decisions.

The system has two coordinated registers. Entry surfaces are cinematic and emotional: full-bleed natural imagery, a thin serif statement, and one bright prompt surface. Planning surfaces are quiet and utilitarian: a white canvas, neutral sans-serif typography, a narrow reading column, faint landscape imagery, and violet reserved for meaningful action or status. Preserve this contrast; do not make the workspace as theatrical as the landing page or flatten the landing page into ordinary application chrome.

Every screen must support the traveller's next thought. Remove anything that competes with the dominant action. The system explicitly rejects generic AI spectacle, abstract geometric imagery, and busy marketing surfaces that compete with the traveller's idea.

**Key Characteristics:**

- One dominant action or decision per surface.
- A centered content measure of 768px with 24px mobile gutters.
- Generous whitespace and an 8px-centered spacing rhythm, with 12px and 24px used for close relationships.
- Expressive serif typography only at the emotional threshold; neutral sans-serif everywhere operational.
- Real natural imagery creates anticipation; interface decoration never tries to replace it.
- Soft, continuous geometry, hairline boundaries, and almost no decorative elevation.
- Responsive layouts preserve hierarchy and emotional scale instead of merely shrinking desktop UI.
- Copy speaks to the traveller as a capable collaborator: personal, specific, and quietly encouraging.

**The Two-Register Rule.** Inspiration may be cinematic; planning must be calm. Carry the same identity across both through the violet accent, logomark, narrow content measure, rounded controls, and nature imagery.

**The 768px Rule.** Default application content to a centered 768px column. Use 24px horizontal gutters below the large breakpoint and remove those gutters only when the full column fits comfortably.

**The One-Thought Rule.** Every element must help the traveller express, refine, review, or confirm the next decision. If it does not, remove it.

## 2. Colors

The palette is a cool, high-contrast neutral field punctuated by one concentrated journey violet. Use semantic CSS variables from `src/styles/globals.css`; never copy raw values into components.

### Primary

- **Journey Violet:** The rare, decisive brand color. Use for the main action, guest-state banner, status emphasis, selection, and focus communication. Large violet surfaces must remain exceptional so they retain authority.
- **Mist Lavender:** The pale foreground paired with Journey Violet. Use for text and icons on primary surfaces.
- **Trailmark Blue:** The logomark's asset color. Treat it as an identity color belonging to the logo, not as a second general-purpose action color.

### Neutral

- **Open Sky:** The default page and card background. It should read as true white, not cream, parchment, or beige.
- **Night Trail:** The primary ink for headings, body copy, and strong icons. It is almost black with a subtle cool cast.
- **Quiet Ground:** The soft surface used by secondary controls, workspace composers, hover states, and skeletons.
- **Distant Ridge:** The supporting text color for descriptions, metadata, placeholders, reasoning markers, and attribution. Do not use it for essential instructions if contrast becomes marginal.
- **Hairline Mist:** The default border and divider color. It separates without turning the page into a collection of boxes.
- **Focus Haze:** The neutral focus-ring anchor. Focus rings use translucent versions of this token or Journey Violet, never an unrelated glow.
- **Signal Red:** Error, destructive, and draft-state signaling only. Never use red ornamentally.

**The Violet Rarity Rule.** Violet signals agency, selection, or important state. It must not wash across routine cards, long text, or decorative backgrounds.

**The True-White Rule.** Application surfaces are white or cool neutral. Warm cream, sand, paper, parchment, and beige backgrounds are prohibited.

**The Natural-Color Rule.** Let photography carry environmental color. UI colors remain quiet enough that the traveller's destination stays visually dominant.

## 3. Typography

**Display Font:** Merriweather Variable (with Georgia and serif fallbacks)

**Body Font:** Geist Variable (with Arial and system sans-serif fallbacks)

**Character:** Merriweather supplies a human, literary sense of departure without making the product editorial. Geist makes planning feel precise, contemporary, and effortless. The contrast between the families marks the transition from imagining a journey to shaping it.

### Hierarchy

- **Display** (100 weight, 48px, 60px line height): Landing-page statements only. Keep the scale at 48px on mobile and allow deliberate wrapping; use balanced text and no negative letter spacing.
- **Headline** (400 weight, 30px, 36px line height, -0.025em): Primary workspace greetings and page-level operational headings.
- **Title** (500 weight, 20px, 28px line height, -0.02em): Section headings such as trip collections.
- **Interface title** (500 weight, 16px, 24px line height, slightly tight tracking): Trip titles, compact headers, and important row labels.
- **Body** (400 weight, 16px, 24px line height): Prompts, explanations, and general UI copy. Keep long-form content within the 768px column and target 65–75 characters per line.
- **Conversation body** (400–500 weight, 14–17px, approximately 1.6 line height): Assistant content is open and text-led; user content is compact and contained.
- **Label** (500 weight, 14px, approximately 20px line height): Buttons, filters, statuses, markers, and metadata labels. Sentence case only.
- **Caption** (400–500 weight, 12px, approximately 16px line height): Attribution and secondary account messaging.

**The Threshold Serif Rule.** Merriweather belongs to the emotional entry point. Do not use it in forms, chat transcripts, lists, filters, account UI, or itinerary controls.

**The Sentence-Case Rule.** Use natural sentence case. Repeated uppercase labels, tracked eyebrows, and numbered section scaffolding are forbidden.

**The Comfortable Reading Rule.** Balance headings, pretty-wrap prose, and keep conversational text airy. Never tighten line height to manufacture density.

## 4. Elevation

Bhromon is flat by default. Depth comes from photographic layers, tonal surface changes, hairline borders, backdrop softening, sticky positioning, and content overlap—not ambient card shadows. Most interactive containers use either a border or a tonal fill. A small shadow is allowed only for an element that genuinely floats or requests approval; it must be restrained and structural.

### Shadow Vocabulary

- **Approval lift** (`shadow-sm`): Reserved for approval or decision surfaces that temporarily sit above the conversation.
- **Card lift** (`shadow-md`): Available in the generic card primitive, but not the default treatment for trip rows or ordinary workspace content.
- **Focus halo** (3px translucent ring): Communicates keyboard focus and validation. It is an interaction state, not decoration.
- **Atmospheric blur** (4–8px backdrop blur): May soften imagery beneath a composer or focused landing state. Always provide reduced-transparency and increased-contrast fallbacks.

**The Flat-by-Default Rule.** Resting surfaces are separated with spacing, a cool tonal shift, or one hairline border. Do not add a shadow simply to make a component feel finished.

**The One-Boundary Rule.** A component may use a border or a decorative shadow, never both. Focus rings are state communication and are exempt.

## 5. Components

Components should feel gently shaped, quiet at rest, and unmistakable when active. Reuse the primitives in `src/components/ui`; extend their variants instead of recreating their geometry and state language locally.

### Buttons

- **Shape:** Full, continuous pill geometry for compact actions (26px radius or fully circular for icon-only controls).
- **Primary:** Journey Violet with Mist Lavender text; 14px medium labels; standard height 36px, compact height 32px, large height 40px.
- **Hover / Focus / Active:** Hover darkens or reduces primary opacity without changing hue. Keyboard focus uses a 3px translucent ring and visible border. Pressing translates downward by 1px. Transitions are brief and functional.
- **Outline:** White background with one Hairline Mist border. On hover, shift to Quiet Ground.
- **Secondary:** Quiet Ground with dark text. Use when the action must remain visible but is not dominant.
- **Ghost:** No resting container. Reveal Quiet Ground on hover or expanded state.
- **Destructive:** Signal Red text on a faint red tint. Never make destructive actions compete with the primary action until the destructive decision is active.

### Chips

- **Style:** Filters use a 32px-high quiet-neutral pill with 12px horizontal padding, a 14px medium label, and a small caret when expandable.
- **State:** Selection is expressed by text, checkmark, or semantic status dot—not by introducing a new accent color.
- **Status dots:** 6px circles. Journey Violet indicates confirmed; Signal Red indicates draft or unresolved status.

### Cards / Containers

- **Corner Style:** Trip rows and empty states use gently curved 18px corners. Compact nested disclosures use 14px. Do not exceed the established radius scale.
- **Background:** White for trip rows and structural surfaces; translucent white is allowed over the landscape stencil. Quiet Ground is used for hover and passive fills.
- **Shadow Strategy:** Flat by default. Trip rows use a hairline border and no shadow.
- **Border:** One Hairline Mist stroke. Focus may replace the border with Journey Violet and add a translucent ring.
- **Internal Padding:** Trip rows use approximately 14px vertical and 16px horizontal padding with a 14px internal gap.
- **Behavior:** Metadata moves below the title on narrow containers and aligns inline when space allows. Preserve this container-aware behavior.

### Inputs / Fields

- **Style:** Multiline composers are signature surfaces. Use 18–22px corners, 16–20px internal padding, large legible placeholder copy, and an action anchored at the lower-right.
- **Paper variant:** White with one Hairline Mist border. Use against photographic or dark surfaces.
- **Workspace variant:** Quiet Ground at roughly 50% strength with no resting border. Use on white planning surfaces.
- **Focus:** Add a visible border and 3px translucent ring. On the landing page, focus may also softly blur the image behind the prompt over 500ms.
- **Error / Disabled:** Error uses Signal Red text, border, and a faint red ring. Disabled controls retain their shape and use 50% opacity without accepting pointer input.
- **Responsive height:** The main trip prompt is 138px on narrow screens and 154px from the small breakpoint. Chat reply composers are shorter and anchored above the safe-area inset.

### Navigation

- **Style:** Navigation is minimal and contextual. Use the logomark, avatar, back action, trip title, and short supporting line only when they help orientation.
- **Desktop:** Keep navigation within the 768px content column. A back button may hang just outside the column to protect text alignment.
- **Mobile:** Use 24px horizontal padding, a compact 61px chat header, one subtle bottom boundary, and truncated titles where necessary.
- **Guest state:** The guest-account notice is a full-width Journey Violet banner above the application chrome. Keep the message warm, the action compact, and the explanatory line visually secondary.

### Trip Prompt Composer

This is Bhromon's signature interaction and usually the dominant object on screen. It must feel like an open invitation rather than a conventional form field. Give it generous height, specific example copy, no visible label, and one circular send action. Validation guidance appears only after the traveller has begun writing; it must not clutter the empty state.

### Conversation

Assistant messages are open on the page with no bubble, allowing long planning content to read like thoughtful guidance. User messages use a compact neutral bubble aligned to the end and capped at 80% width. Message groups are separated by 32px; messages within a group use 8px. Reasoning and tool activity are quiet gray markers that can expand without competing with the answer. Keep the composer anchored and the transcript independently scrollable.

### Imagery

The landing page uses one decisive full-bleed natural landscape with a dark slate overlay strong enough to support white type. Planning pages use a grayscale mountain stencil as a low-contrast, bottom-anchored watermark with multiply blending. Images are atmospheric and non-interactive; they must never reduce copy or control legibility.

### Motion and Responsive Behavior

Use motion to explain state: 100–200ms color and disclosure transitions, a 500ms focus softening on the landing image, automatic list reflow, streaming feedback, and a scroll-to-end control. Use ease-out curves and provide reduced-motion alternatives. At mobile widths, preserve the 48px display scale, stack metadata, retain 24px gutters, and respect `env(safe-area-inset-bottom)` around anchored controls.

## 6. Do's and Don'ts

### Do:

- **Do** begin every surface by identifying the traveller's single next thought or decision.
- **Do** default application content to a centered 768px column with 24px mobile gutters.
- **Do** use the existing semantic color variables and component primitives; extend variants rather than introducing near-duplicate values.
- **Do** reserve Journey Violet for decisive actions, selection, status, focus, and the guest-state banner.
- **Do** use real natural imagery to create anticipation on entry surfaces and a subtle landscape stencil in the workspace.
- **Do** maintain the serif-to-sans transition between emotional entry and operational planning.
- **Do** use generous whitespace: 24px between closely related hero elements, 32px between major workspace groups, and 48–64px for section endings or page breathing room.
- **Do** preserve clear focus rings, WCAG 2.2 AA contrast, reduced-motion behavior, reduced-transparency fallbacks, and safe-area spacing.
- **Do** write warm, personal, specific copy that reinforces traveller agency.
- **Do** test at narrow mobile widths and at the 768px content boundary; hierarchy must survive without horizontal overflow.

### Don't:

- **Don't** introduce generic AI spectacle.
- **Don't** use abstract geometric imagery.
- **Don't** create busy marketing surfaces that compete with the traveller's idea.
- **Don't** use cream, sand, parchment, beige, or other warm-neutral page backgrounds; Bhromon's workspace is true white and cool neutral.
- **Don't** spread violet across routine cards or long content. Its rarity is part of the hierarchy.
- **Don't** use Merriweather inside operational UI or turn the product into an editorial-magazine layout.
- **Don't** add repeated uppercase tracked eyebrows, numbered section markers, gradient text, decorative glassmorphism, or identical card grids.
- **Don't** use side-stripe accents, diagonal stripe backgrounds, sketchy SVG illustrations, or colored placeholder rectangles where real imagery belongs.
- **Don't** combine a decorative border with a wide soft shadow. Pick one structural boundary.
- **Don't** invent arbitrary radii. Cards stop at 18px, multiline inputs at 22px, and pills at 26px or fully circular.
- **Don't** place assistant replies in bubbles. Open text is an intentional part of the conversation hierarchy.
- **Don't** shrink expressive type reflexively on mobile; wrap it deliberately and verify every line.
- **Don't** add navigation, explanatory copy, badges, or secondary actions that do not help the traveller take the next step.
