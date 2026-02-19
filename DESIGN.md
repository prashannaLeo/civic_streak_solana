# Civic Streak - UI/UX Design Document

## 1. Project Overview

**Civic Streak** is a gamified civic engagement platform built on the Solana blockchain that rewards users for consistent participation in civic activities. The platform encourages community involvement by tracking user engagement streaks and awarding unique badges as recognition for their dedication to civic duties.

### Core Features
- **Streak Tracking**: Track consecutive days of civic participation
- **Badge System**: Earn badges for various achievements (Civic Starter, Civic Citizen, Civic Champion)
- **Wallet Integration**: Connect Solana wallets (Phantom, Solflare) for authentication
- **Blockchain Storage**: All streak data is stored on Solana devnet for transparency and permanence

### Target Users
- Community activists and volunteers
- Citizens interested in civic engagement
- Blockchain enthusiasts wanting to participate in Web3 civic platforms

---

## 2. Design Principles

### 2.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Trust through Transparency** | All data is stored on-chain, making user achievements verifiable and permanent |
| **Accessibility First** | Ensure the platform is usable by people of all abilities and technical backgrounds |
| **Progressive Disclosure** | Show complex information gradually to avoid overwhelming new users |
| **Dark Theme Priority** | Use dark theme as primary to reduce eye strain during extended use |
| **Gradient Accents** | Use purple-to-amber gradients to convey innovation and warmth |
| **Responsive Flexibility** | Design for all screen sizes from mobile to desktop |

### 2.2 Design Philosophy
- **Minimal but Bold**: Clean interfaces with purposeful use of color and typography
- **Crypto-Native Feel**: Blend traditional web design with blockchain aesthetic elements
- **Community-Centric**: Emphasize collective achievement and community building

---

## 3. Color System

### 3.1 Primary Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Primary Purple** | `#8B5CF6` | Main brand color, buttons, active states |
| **Primary Light** | `#A78BFA` | Hover states, secondary accents |
| **Primary Dark** | `#7C3AED` | Pressed states, emphasis |

### 3.2 Accent Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Amber Accent** | `#F59E0B` | Highlights, badges, special achievements |
| **Success Green** | `#10B981` | Success states, active streaks |
| **Warning Orange** | `#F97316` | Warnings, streak at risk |
| **Error Red** | `#EF4444` | Errors, disconnected wallet |

### 3.3 Background Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Background Dark** | `#0F172A` | Main background |
| **Surface Dark** | `#1E293B` | Cards, elevated surfaces |
| **Surface Light** | `#334155` | Hover states, borders |
| **Border Subtle** | `rgba(139, 92, 246, 0.15)` | Subtle borders |

### 3.4 Text Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Text Primary** | `#F8FAFC` | Main text, headings |
| **Text Secondary** | `#94A3B8` | Secondary text, descriptions |
| **Text Muted** | `#64748B` | Placeholder, disabled states |

### 3.5 CSS Variables

```css
:root {
  /* Primary */
  --color-primary: #8B5CF6;
  --color-primary-light: #A78BFA;
  --color-primary-dark: #7C3AED;
  
  /* Accent */
  --color-amber: #F59E0B;
  --color-success: #10B981;
  --color-warning: #F97316;
  --color-error: #EF4444;
  
  /* Background */
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-surface-hover: #334155;
  
  /* Text */
  --color-text-primary: #F8FAFC;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
}
```

---

## 4. Typography

### 4.1 Font Family

| Usage | Font Family |
|-------|--------------|
| **Primary Font** | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif` |
| **Monospace** | `'JetBrains Mono', 'Fira Code', monospace` (for wallet addresses) |

### 4.2 Font Sizes

| Size Name | Size | Line Height | Usage |
|-----------|------|-------------|-------|
| **xs** | 0.75rem (12px) | 1.5 | Labels, badges |
| **sm** | 0.875rem (14px) | 1.5 | Secondary text, captions |
| **base** | 1rem (16px) | 1.6 | Body text |
| **lg** | 1.125rem (18px) | 1.6 | Lead paragraphs |
| **xl** | 1.25rem (20px) | 1.5 | Section titles |
| **2xl** | 1.5rem (24px) | 1.4 | Card titles |
| **3xl** | 1.875rem (30px) | 1.3 | Page titles |
| **4xl** | 2.25rem (36px) | 1.2 | Hero text |
| **5xl** | 3rem (48px) | 1.1 | Large display |

### 4.3 Font Weights

| Weight Name | Value | Usage |
|-------------|-------|-------|
| **Regular** | 400 | Body text |
| **Medium** | 500 | Navigation, labels |
| **Semibold** | 600 | Subheadings, emphasis |
| **Bold** | 700 | Headings, titles |
| **Extrabold** | 800 | Large display numbers |

### 4.4 Type Scale

```css
/* Typography Scale */
h1 { font-size: 2.5rem; font-weight: 700; }
h2 { font-size: 2rem; font-weight: 700; }
h3 { font-size: 1.5rem; font-weight: 600; }
h4 { font-size: 1.25rem; font-weight: 600; }
p { font-size: 1rem; font-weight: 400; line-height: 1.6; }
small { font-size: 0.875rem; }
```

---

## 5. Component Library

### 5.1 Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  color: #F8FAFC;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: rgba(139, 92, 246, 0.1);
  color: #A78BFA;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid rgba(139, 92, 246, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(139, 92, 246, 0.2);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: rgba(248, 250, 252, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  color: #F8FAFC;
  background: rgba(139, 92, 246, 0.1);
}
```

### 5.2 Cards

#### Base Card
```css
.card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}
```

#### Streak Card
```css
.streak-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
}
```

### 5.3 Badges

#### Status Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #FBBF24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
```

#### Achievement Badge
```css
.achievement-badge {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%);
  font-size: 2rem;
}
```

### 5.4 Forms

#### Input Field
```css
.input-field {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: #F8FAFC;
  font-size: 1rem;
  transition: all 0.2s ease;
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.input-field::placeholder {
  color: #64748B;
}
```

### 5.5 Navigation

#### Header/Navbar
```css
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}
```

#### Nav Link
```css
.nav-link {
  padding: 0.5rem 1rem;
  color: rgba(248, 250, 252, 0.7);
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #F8FAFC;
  background: rgba(139, 92, 246, 0.1);
}

.nav-link.active {
  color: #A78BFA;
  background: rgba(139, 92, 246, 0.15);
}
```

### 5.6 Component States

| Component | Default | Hover | Active | Disabled |
|-----------|---------|-------|--------|----------|
| Primary Button | Purple gradient | Lift + glow | Scale 0.98 | 50% opacity |
| Secondary Button | Purple outline | Fill purple | Scale 0.98 | 50% opacity |
| Card | Dark surface | Lift + border | - | Grayed out |
| Input | Dark border | Purple border | Purple glow | Muted text |
| Nav Link | Gray text | Light bg | Purple text | 50% opacity |

---

## 6. Wireframes

### 6.1 Desktop Layout (1200px+)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] Civic Streak              [Home][About][How]  [GitHub] │
│                                                    [Devnet Badge]│
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                    STREAK DISPLAY                        │      │
│  │              🔥 42 Day Streak! 🔥                       │      │
│  │            "Keep the momentum going!"                   │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │   WALLET STATUS      │  │   YOUR BADGES       │               │
│  │  [Connect Wallet]   │  │  🏆 🥉 🥈          │               │
│  │  or                 │  │  [View All]         │               │
│  │  0x1234...5678      │  │                     │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                  ACTIVITY CALENDAR                      │      │
│  │   Jan 2024                                               │      │
│  │   M  T  W  T  F  S  S                                   │      │
│  │   [●][●][●][○][●][●][●] ...                            │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
├─────────────────────────────────────────────────────────────────┤
│  © 2024 Civic Streak  |  [Solana Docs] [Anchor] [GitHub]        │
│            Built with Solana + Anchor                            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Mobile Layout (< 768px)

```
┌─────────────────────────┐
│  [Logo] Civic Streak   │
│         [GitHub]       │
├─────────────────────────┤
│                         │
│  🔥 42 Day Streak! 🔥  │
│  "Keep it going!"       │
│                         │
│  ┌───────────────────┐ │
│  │ [Connect Wallet]  │ │
│  └───────────────────┘ │
│                         │
│  Your Badges: 🏆 🥉    │
│                         │
│  [Activity Grid]       │
│  ● ● ● ○ ● ● ●         │
│                         │
├─────────────────────────┤
│  © 2024 Civic Streak   │
│  [Docs] [Anchor]       │
└─────────────────────────┘
```

### 6.3 Component Wireframes

#### Streak Counter Component
```
┌────────────────────────────┐
│       🔥 FIRE ICON         │
│                            │
│         42                │
│       Days                │
│                            │
│  ████████████████░░░░░░░  │
│     Current Streak        │
│                            │
│  "Great job! Keep going!" │
└────────────────────────────┘
```

#### Badge Display Component
```
┌──────────────────────────────────────┐
│         BADGE COLLECTION             │
├──────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐  │
│  │   🏆   │  │   🥉   │  │   🥈   │  │
│  │Champion│  │ Citizen│  │ Starter│  │
│  └────────┘  └────────┘  └────────┘  │
│                                      │
│         [+ View All Badges]         │
└──────────────────────────────────────┘
```

---

## 7. User Flows

### 7.1 New User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│  Connect    │────▶│   Dashboard │
│    Page     │     │   Wallet    │     │    View     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                       │
      │                                       ▼
      │                              ┌─────────────┐
      │                              │   Welcome   │
      │                              │    Modal    │
      │                              └─────────────┘
      │                                       │
      ▼                                       ▼
┌─────────────┐                      ┌─────────────┐
│   Learn     │                      │   Start     │
│   More     │                      │  Streak!    │
└─────────────┘                      └─────────────┘
```

### 7.2 Returning User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Open      │────▶│   Verify    │────▶│   View      │
│   App       │     │   Wallet    │     │   Streak    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                      ┌─────────────┐
                                      │   Check     │
                                      │   Badges    │
                                      └─────────────┘
```

### 7.3 Badge Earning Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Complete   │────▶│   On-chain  │────▶│   Badge     │
│  Activity   │     │   Record    │     │   Awarded   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Solana    │     │  Celebration│
                    │  Network    │     │   Animation │
                    └─────────────┘     └─────────────┘
```

### 7.4 Key User Journeys

| Journey | Steps | Success Criteria |
|---------|-------|------------------|
| **First Visit** | Land → Read About → Connect Wallet → View Dashboard | User connects wallet and sees streak |
| **Daily Check-in** | Open App → Auto-connect → View Today's Status | User sees current streak within 3 seconds |
| **Earn Badge** | Complete Activity → Wait for Confirmation → View New Badge | Badge appears in collection with animation |
| **View History** | Open App → Navigate to Badges → Browse Collection | All earned badges display with dates |

---

## 8. Accessibility

### 8.1 WCAG 2.1 AA Compliance

#### Color Contrast
- **Text on Background**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio against adjacent colors
- Current implementation uses:
  - Primary text (#F8FAFC) on dark background (#0F172A): ~15:1 ✓
  - Secondary text (#94A3B8) on dark background: ~6:1 ✓

#### Focus Indicators
```css
*:focus-visible {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}
```

#### Keyboard Navigation
- All interactive elements must be focusable via Tab
- Logical tab order following visual layout
- Skip-to-content link for main content
- Keyboard shortcuts for common actions

#### Screen Reader Support
- Semantic HTML5 elements (`<header>`, `<main>`, `<footer>`, `<nav>`)
- ARIA labels for icon-only buttons
- Live regions for dynamic content updates
- Descriptive link text (no "click here")

### 8.2 Accessibility Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Alt Text** | All images have descriptive alt attributes | ✓ |
| **Form Labels** | All inputs have associated labels | ✓ |
| **Error Messages** | Form errors announced to screen readers | ✓ |
| **Resizable Text** | Supports 200% zoom without horizontal scroll | ✓ |
| **Touch Targets** | Minimum 44x44px for mobile interactions | ✓ |
| **Motion** | Respects prefers-reduced-motion | ✓ |
| **Contrast** | All text meets WCAG AA standards | ✓ |

### 8.3 ARIA Implementation

```html
<!-- Navigation -->
<nav aria-label="Main navigation">
  <button aria-current="page">Home</button>
</nav>

<!-- Wallet Status -->
<div role="status" aria-live="polite">
  Wallet connected: 0x1234...5678
</div>

<!-- Streak Display -->
<div role="progressbar" 
     aria-valuenow="42" 
     aria-valuemin="0" 
     aria-valuemax="365"
     aria-label="Current streak">
```

### 8.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Responsive Breakpoints

### 9.1 Breakpoint System

| Breakpoint | Width | Target |
|------------|-------|--------|
| **xs** | < 480px | Small mobile devices |
| **sm** | 480px - 767px | Large mobile devices |
| **md** | 768px - 1023px | Tablets |
| **lg** | 1024px - 1279px | Small laptops |
| **xl** | 1280px - 1535px | Desktop computers |
| **2xl** | ≥ 1536px | Large screens |

### 9.2 CSS Breakpoint Implementation

```css
/* Mobile First - Base styles */

/* Small devices (landscape phones) */
@media (min-width: 480px) {
  .container { max-width: 480px; }
}

/* Tablets */
@media (min-width: 768px) {
  .container { max-width: 768px; }
  .header-nav { display: flex; }
}

/* Small laptops */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### 9.3 Responsive Component Behavior

| Component | Mobile (< 768px) | Tablet (768-1023px) | Desktop (≥ 1024px) |
|-----------|------------------|---------------------|-------------------|
| **Header** | Hamburger menu | Full nav | Full nav + social |
| **Streak Card** | Full width | Centered, 80% | Centered, 600px max |
| **Badge Grid** | 2 columns | 3 columns | 4+ columns |
| **Footer** | Stacked links | Row layout | Full row layout |
| **Buttons** | Full width | Auto width | Auto width |

### 9.4 Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

---

## 10. Spacing System

### 10.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 0.25rem (4px) | Tight spacing, icon padding |
| `space-2` | 0.5rem (8px) | Small gaps, inline elements |
| `space-3` | 0.75rem (12px) | Component internal spacing |
| `space-4` | 1rem (16px) | Standard spacing |
| `space-5` | 1.25rem (20px) | Section padding |
| `space-6` | 1.5rem (24px) | Card padding |
| `space-8` | 2rem (32px) | Section gaps |
| `space-10` | 2.5rem (40px) | Large section gaps |
| `space-12` | 3rem (48px) | Hero spacing |
| `space-16` | 4rem (64px) | Page-level spacing |

### 10.2 Usage Guidelines

```css
/* Component spacing */
.card { padding: var(--space-6); }
.card + .card { margin-top: var(--space-4); }

/* Section spacing */
.section { padding: var(--space-8) var(--space-4); }

/* Grid gaps */
.grid { gap: var(--space-6); }

/* Inline spacing */
.button-group { gap: var(--space-3); }
```

---

## 11. Animation Guidelines

### 11.1 Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Micro-interactions |
| `duration-normal` | 200ms | Standard transitions |
| `duration-slow` | 300ms | Page transitions |
| `ease-default` | ease | Standard easing |
| `ease-in` | cubic-bezier(0.4, 0, 1, 1) | Enter animations |
| `ease-out` | cubic-bezier(0, 0, 0.2, 1) | Exit animations |
| `ease-bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Bounce effects |

### 11.2 Keyframe Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Glow */
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.5); }
  50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.8); }
}
```

### 11.3 Component Animations

| Component | Animation | Duration | Trigger |
|-----------|-----------|----------|----------|
| **Card Hover** | translateY + shadow | 200ms | Hover |
| **Button Press** | scale(0.98) | 100ms | Active |
| **Badge Earned** | bounce + glow | 600ms | Award |
| **Streak Update** | counter increment | 400ms | Value change |
| **Modal Open** | fade + scale | 300ms | Open action |
| **Page Transition** | slide | 300ms | Route change |

---

## 12. Design Tokens Summary

### Quick Reference

```css
:root {
  /* Colors */
  --color-primary: #8B5CF6;
  --color-primary-light: #A78BFA;
  --color-amber: #F59E0B;
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-text: #F8FAFC;
  --color-text-muted: #64748B;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  
  /* Borders */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px rgba(139, 92, 246, 0.4);
}
```

---

## Document Information

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | February 2024 |
| **Author** | Civic Streak Team |
| **Status** | Active |

---

*This design document serves as the single source of truth for all Civic Streak UI/UX decisions. All team members should refer to this document when making design choices.*
