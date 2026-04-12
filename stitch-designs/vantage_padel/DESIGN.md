# Design System Document

## 1. Overview & Creative North Star
This design system is engineered for a high-performance padel management environment. It bridges the gap between elite athletic energy and executive administrative precision.

**Creative North Star: "The Elite Court"**
Much like a pristine padel court, the interface must feel expansive, structured, and high-contrast. We move beyond generic SaaS templates by utilizing "Editorial Athletics"—a style characterized by bold, all-caps typography, asymmetric content weighting, and a depth model that mimics physical layers of glass and court surfaces. We prioritize "breathability" over density, ensuring that even data-heavy tables feel premium and easy to navigate.

---

## 2. Colors
Our palette is anchored in deep "Grandstand" navies and high-octane "Athletic Blue" accents.

### Color Tokens (Material Design 3 Convention)
*   **Primary:** `#144bdb` (The engine of the UI, used for high-intent actions)
*   **Primary Container:** `#3b66f5` (A lighter, vibrant blue for active states and highlights)
*   **Inverse Surface:** `#1f3051` (Deep Navy: reserved for the Sidebar and high-contrast headers)
*   **Surface:** `#f9f9ff` (The "base" court color—cool-toned and clean)
*   **Tertiary:** `#006746` (Success/Victory state)
*   **Error:** `#ba1a1a` (Loss/Error state)

### The "No-Line" Rule
To maintain a high-end editorial feel, **1px solid borders are prohibited for sectioning.** We define boundaries through tonal shifts. For example, a card (`surface_container_lowest`) sits on a page background (`surface`) to create separation. Use white space as your primary divider.

### Surface Hierarchy & Nesting
Use the container tiers to create "Physicality":
*   **Surface (Base):** The main background.
*   **Surface Container Low:** For subtle grouping or secondary sections.
*   **Surface Container Lowest:** Pure white (`#ffffff`), used for primary cards to make them "pop" against the background.

### The "Glass & Gradient" Rule
Floating elements (like Tooltips or the Sidebar Active State) should utilize a subtle **Glassmorphism** effect.
*   *Implementation:* Use a semi-transparent version of the color with a `backdrop-blur: 12px`.
*   *Signature Texture:* For primary CTAs, use a subtle linear gradient from `primary` to `primary_container` (Top-Left to Bottom-Right) to provide a "sheen" reminiscent of high-end athletic gear.

---

## 3. Typography
The typography system uses a dual-font approach: **Manrope** for authoritative headers and **Inter** for high-legibility data.

*   **Display (Manrope):** Large, aggressive, and confident. Used for page titles like "HISTORIAL DE PARTIDOS." 
    *   *Editorial Note:* Use `text-transform: uppercase` and `letter-spacing: 0.05em` for section headers to evoke a sports-broadcast feel.
*   **Headlines/Titles (Manrope/Inter):** Bold weights (700+) to anchor cards and sections.
*   **Body (Inter):** Medium and Small sizes (0.875rem to 1rem). Inter’s tall x-height ensures that player names and match scores remain legible at high speeds.
*   **Labels (Inter):** All-caps, semi-bold, and slightly tracked out for metadata (e.g., "CATEGORÍA A").

---

## 4. Elevation & Depth
We eschew traditional drop shadows in favor of **Tonal Layering** and **Ambient Light.**

*   **The Layering Principle:** Depth is achieved by "stacking." A player's profile card should be `surface_container_lowest`. A sub-section within that card should be `surface_container_high`.
*   **Ambient Shadows:** For floating modals or "Hover" states on cards, use an extra-diffused shadow:
    *   *Values:* `0 20px 40px rgba(7, 27, 59, 0.06)`
    *   *Color:* Always tint the shadow with the `on_surface` color (`#071b3b`) rather than using flat black.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. High rounding (`xl` scale). Bold caps label.
*   **Secondary:** Ghost style. Transparent background with a `primary` "Ghost Border."
*   **Tertiary:** Text-only, using `primary` color for navigation within cards.

### Cards & Data Lists
*   **Rule:** Forbid divider lines.
*   **Implementation:** Use a vertical spacing of `1.5` (0.375rem) between list items. Use a `surface_container_low` hover state to highlight the row. 
*   **Status Indicators:** Chips for "VICTORIA" or "DERROTA" must use high-contrast caps with a 10% opacity background of the respective status color (e.g., Green text on pale green bg).

### Navigation (Sidebar)
*   **Style:** Dark mode (`inverse_surface`). 
*   **Active State:** Use a "pill" shape with `primary_container` background. Add a subtle inner glow to simulate the "Active" energy of a padel court light.

### Input Fields
*   Minimalist style. `surface_container_lowest` background. Only use a bottom border or a very faint `ghost border` on all sides. On focus, the border transitions to a 2px `primary` highlight.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use asymmetrical layouts. A heavy left column for data and a slim right column for "Quick Actions" creates a professional, dashboard-like hierarchy.
*   **Do** use `all-caps` for labels and secondary headers to maintain the "ST. GEORGE" athletic brand identity.
*   **Do** leverage the `xl` (1.5rem) roundedness for buttons and the `lg` (1rem) for main cards.

### Don't:
*   **Don't** use black (`#000000`). Even for text, use `on_surface` (#071b3b) to keep the UI feeling "designed" rather than default.
*   **Don't** use standard table borders. Rely on the "No-Line Rule" to separate rows with whitespace or subtle color shifts.
*   **Don't** cram content. If a section feels tight, increase the Spacing Scale token from `4` to `6`. Luxury is defined by space.