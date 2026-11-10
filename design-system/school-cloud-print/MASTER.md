# Design System Master: School Cloud Print Station

**Product Type:** Educational Institution Productivity & Hardware Telemetry SaaS  
**Stack:** Next.js 14 (App Router), React 18, Tailwind CSS 3.4, Lucide Icons  
**Target Users:** School Teachers (`@guru.*.belajar.id`) on Mobile/Desktop & TU Administrators  

---

## 1. Color Palette (Semantic Tokens)

Derived from `ui-ux-pro-max` **Productivity Tool** palette (Teal Focus + Action Orange), tuned for WCAG AA/AAA contrast in bright school office & mobile outdoor environments:

| Token | CSS Variable | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary` | `#0D9488` | Main brand actions, active states, primary buttons, quota progress |
| **Primary Hover** | `--color-primary-hover` | `#0F766E` | Button hover & active focus states (contrast > 5.4:1 on white) |
| **On Primary** | `--color-on-primary` | `#FFFFFF` | Text & icons on primary surfaces |
| **Secondary** | `--color-secondary` | `#14B8A6` | Secondary badges, subtle highlights, active indicators |
| **Accent / CTA** | `--color-accent` | `#EA580C` | High-priority actions: Confidential "Rilis Sekarang" & Lock badges |
| **On Accent** | `--color-on-accent` | `#FFFFFF` | Text on orange accent buttons |
| **Background** | `--color-background` | `#F0FDFA` | Subtle cool-mint/slate app background canvas |
| **Surface / Card** | `--color-card` | `#FFFFFF` | Elevated cards, modals, header bar |
| **Foreground** | `--color-foreground` | `#134E4A` | Primary headings & high-emphasis text (10.2:1 contrast) |
| **Muted** | `--color-muted` | `#F1F5F9` | Subtle wells, dropzones, ink gauge tracks |
| **Muted Foreground** | `--color-muted-foreground` | `#475569` | Secondary labels, metadata, timestamps (7.5:1 contrast) |
| **Border** | `--color-border` | `#CCFBF1` | Card & input borders |
| **Destructive** | `--color-destructive` | `#DC2626` | Out-of-paper emergency banner, failed print jobs, quota critical |

---

## 2. Typography

From `ui-ux-pro-max` **Friendly SaaS** + **Dashboard Data** pairings:
- **Sans (Headings & UI Body):** `Plus Jakarta Sans` (weights: 400, 500, 600, 700)
- **Mono (Metrics, Quota Counters, Ink Percentages):** `Fira Code` (weights: 500, 600)
- **Scale & Rhythm:** Base `16px` (`1rem`), line-height `1.5`, tabular numerals (`tabular-nums`) on all counters and percentages.

---

## 3. Layout, Touch & Accessibility Rules

1. **Touch Targets:** Minimum `44×44px` (`min-h-[44px]`) on all interactive buttons, inputs, and release triggers for teachers using smartphones in front of the printer.
2. **Focus Visibility:** All interactive controls include `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
3. **Icons:** Crisp SVG icons via `lucide-react` (`aria-hidden="true"` on decorative icons).
4. **Hardware Feedback:**
   - Out-of-Paper state triggers a high-contrast `#DC2626` alert banner with `role="alert"`.
   - Confidential Hold-and-Release jobs use warm amber/orange `#EA580C` semantic indicators to distinguish them from regular FIFO jobs.
