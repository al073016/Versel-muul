# Design System Strategy: The Editorial Intelligence

## 1. Overview & Creative North Star
**The Creative North Star: "The Intelligent Curator"**

This design system moves away from the "big-box retailer" aesthetic of dense grids and loud banners. Instead, we are adopting the role of an **Intelligent Curator**. The experience should feel like a high-end editorial magazine fused with a precision data tool. 

We achieve this through:
*   **Intentional Asymmetry:** Breaking the expected 12-column rigidity to allow for "breathing pockets" of whitespace.
*   **Typographic Tension:** Pairing the historical, serif warmth of `newsreader` (our surrogate for Reckless) with the ultra-modern utility of `spaceGrotesk` (our Monosten counterpart).
*   **Data-Driven Warmth:** Using the Coppel Yellow (`secondary_container`) not as a loud promotional tool, but as a "highlighting" device to guide the eye toward intelligence and value.

The goal is a signature visual identity that feels human and optimistic, yet backed by the authority of "data-driven intelligence."

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
**Lines are a sign of structural weakness.** In this design system, we prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts or subtle tonal transitions. A section is not "contained"; it is "situated."

### Surface Hierarchy & Nesting
Instead of a flat grid, treat the UI as a series of physical layers—like stacked sheets of fine paper. 
*   **Base:** `surface` (#f8f9ff) is your canvas.
*   **The Nesting Principle:** To define a card or a unique section, use `surface_container_low` (#eff3ff). If you need to nest an element within *that* (like a search bar or an input), move to `surface_container_lowest` (#ffffff). This "Light-on-Darker-on-Light" approach creates depth without visual clutter.

### The "Glass & Gradient" Rule
To elevate the "Intelligence" vibe, use **Glassmorphism** for floating headers or navigation overlays. 
*   **Token Usage:** Use `surface` at 80% opacity with a `24px` backdrop-blur. 
*   **Signature Gradients:** For Hero backgrounds or Primary CTAs, transition from `primary` (#003e6f) to `primary_container` (#005596) at a 135-degree angle. This adds "soul" and prevents the flat, "out-of-the-box" UI feel.

---

## 3. Typography: The Editorial Voice

Our typography scale is designed to create a rhythmic hierarchy that feels both prestigious and accessible.

*   **Display & Headlines (`newsreader`):** These are our "Editorial Voice." Use them for aspirational storytelling and major category headers. They provide the "Warmth" in our vibe.
*   **Body & Titles (`plusJakartaSans`):** Our workhorse. Used for product descriptions and CTAs, providing the "Optimistic" clarity required for high-volume retail.
*   **Metadata & Eyebrows (`spaceGrotesk`):** The "Intelligence." Use this for technical specs, price data, and category tags (e.g., "HOGAR VERDE"). Its monospaced DNA signals data-driven precision.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved via **Tonal Layering**. 
*   Place a `surface_container_lowest` card on a `surface_container_low` background. The contrast is barely perceptible but enough for the human eye to register a shift in importance.

### Ambient Shadows
Avoid standard "Drop Shadows." When an element must float (e.g., a modal or a floating action button):
*   **Color:** Use a tint of `on_surface` (#001c39) at 6% opacity.
*   **Blur:** High diffusion (minimum 32px blur) to mimic natural, ambient light.

### The "Ghost Border" Fallback
If accessibility testing requires a container boundary, use the **Ghost Border**:
*   **Token:** `outline_variant` at 15% opacity. Never 100%.

---

## 5. Component Logic

### Buttons: The Tactile Command
*   **Primary:** Gradient of `primary` to `primary_container`. Shape: `full` (pill-shaped). This encourages a "friendly" touch.
*   **Secondary:** `secondary_container` (#fed000) with `on_secondary_container` text. Use for high-conversion retail actions.
*   **States:** On hover, increase the surface brightness by 5%; do not change the hue.

### Search Bars: The Knowledge Hub
The search bar is the most prominent element. 
*   **Style:** `surface_container_lowest` background, `xl` (1.5rem) roundedness, and a subtle `outline_variant` (15% opacity).
*   **Interaction:** On focus, the search bar should "grow" slightly (scale 1.02) and trigger a `40%` opacity `on_surface` overlay on the content below to focus the user’s intent.

### Cards: No Dividers Allowed
Forbid the use of divider lines. 
*   **Separation:** Use `md` (0.75rem) vertical white space.
*   **Grouping:** Group related data using the `spaceGrotesk` label font in `primary` color to anchor the content block.

### Intelligent Micro-Components
*   **Contextual Badges:** For categories like "Hogar Verde," use `tertiary_container` (#096119) with `on_tertiary_fixed` (#002204) text. Shape: `sm` (0.25rem) for a more "technical" feel.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** lean into extreme scale differences between `display-lg` and `label-sm`. This creates an editorial "look."
*   **Do** use the `secondary` (Yellow) palette sparingly as an accent—it’s a spotlight, not a floodlight.
*   **Do** ensure all text on `surface` backgrounds uses `on_surface` (#001c39) to maintain AAA accessibility.

### Don't:
*   **Don't** use 1px lines to separate list items. Use a 4px gap and a subtle shift to `surface_container_low` on hover.
*   **Don't** use pure black (#000000) for shadows or text. It breaks the "Warm" vibe. Use `on_background`.
*   **Don't** cram components. If you think there is enough whitespace, add 20% more.