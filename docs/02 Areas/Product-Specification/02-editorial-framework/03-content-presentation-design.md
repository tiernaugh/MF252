# Content Presentation & Design

This document outlines the core design principles for how episodic content is presented to the user. The guiding philosophy is rooted in creating a calm, focused, and premium reading experience, inspired by the "Invisible Interface" concept.

---

## 1. Unified & Seamless Styling

-   **Principle:** Content blocks should *not* be visually differentiated from one another using distinct background colours, borders, or icons. (they can be different - eg. a quote block compared to a text block, but like notion, they should feel part of the same language)
-   **Rationale:** The narrative rhythm and flow of an episode are editorial constructs. They should be felt by the reader through the structure, pacing, and quality of the writing, not explicitly pointed out by UI chrome. A uniform, clean background across all block types creates a serene, uncluttered reading environment that prioritizes the content itself.
-   **Implementation:** All content blocks will share a single, light background colour. Differentiation comes from typography (e.g., section headers) and structure (e.g., lists), not from container styling.

## 2. Refined & Human-Centric Copy

-   **Principle:** All UI text, especially titles and headers, must be editorial and human-centric, not technical or report-like.
-   **Rationale:** We are building a "thinking partner," not a database renderer. Titles like "Research Planning" should be rephrased to be more direct and engaging, such as "What I'm Investigating Next." This small detail significantly impacts the product's tone of voice.

## 3. Universal Markdown Support

-   **Principle:** All user-facing text that supports formatting must be rendered correctly.
-   **Rationale:** Displaying raw markdown (`**bold**`) to a user is a sign of an unpolished product and erodes trust. Proper text rendering is a foundational requirement for a premium experience.

## 4. Simplified & Elegant Typography

-   **Principle:** Use typography as the primary tool for hierarchy and emphasis, avoiding decorative styles.
-   **Rationale:** Overuse of italics, special icons, or varied font treatments can make the interface feel cheap and unfocused. A consistent and well-considered typographic system is more than enough to guide the reader's eye effectively.

## 5. Information Architecture & Header Design

-   **Principle:** Create clear information hierarchy with purposeful separation between context, episode identity, and content.
-   **Structure:**
    -   **Top Navigation:** Project context and AI agent branding (establishing the research context)
    -   **Centered Hero Section:** Episode identity and title (the primary content focus)
    -   **Content Area:** The actual episode content (the reading experience)
-   **Rationale:** This three-tier structure creates proper information layering that guides the user from context → identity → content. The centered approach adds gravitas appropriate for premium research content.

## 6. AI Agent Personification

-   **Principle:** The AI research agent (Futura) should have a clear but subtle visual identity that builds trust without being distracting.
-   **Implementation:** Simple avatar/icon with consistent branding placement (e.g., "researched by Futura")
-   **Rationale:** Personifying the AI agent creates accountability and trust while making the platform feel less like a cold data renderer. The branding should be professional and refined, never cartoonish or overly playful.

## 7. Optimal Reading Layout

-   **Principle:** Content width should prioritize sustained reading over screen real estate utilization.
-   **Specification:** Maximum content width of approximately 65-70 characters per line (roughly `max-w-3xl` in Tailwind)
-   **Rationale:** Optimal line length for comprehension and eye comfort during extended reading sessions. This directly serves the "Invisible Interface" principle by prioritizing the reading experience above all else.

---

## 8. Text Selection & Context Interaction

### Selection-First Interaction Model
-   **Principle:** Text highlighting for precise passage selection takes priority over block-level interactions.
-   **Rationale:** Users think in terms of specific insights and key phrases, not arbitrary content block boundaries. The most valuable user action is selecting exactly the text that sparked their thinking.
-   **Technical Foundation:** Native browser Selection API provides robust, accessible text selection without external dependencies.

### Floating Toolbar Design Philosophy
-   **Visual Design:** Minimal, premium styling that doesn't compete with content for attention.
-   **Specification:** `bg-white/90 backdrop-blur-sm shadow-lg rounded-md` with single clear action
-   **Positioning:** Fixed above selected text with automatic horizontal centering
-   **Behavior:** Auto-dismiss on scroll, escape key, or action completion to maintain non-intrusive interaction

### Context Actions & User Intent
-   **Primary Action:** "Add to chat" enables incorporating specific passages into AI discussion context
-   **Interface Design:** Single button with icon + text label eliminates cognitive load and decision paralysis
-   **Selection Scope:** Limited to episode content area prevents inappropriate toolbar appearance on navigation elements

### Technical Architecture Requirements
-   **Web Platform Integration:** Leverage native Selection API rather than external libraries for maximum compatibility
-   **React Lifecycle Management:** Custom hooks with comprehensive event cleanup prevent memory leaks
-   **Mobile Compatibility:** Architecture accommodates coexistence with native mobile selection menus
-   **Performance:** Efficient event handling ensures smooth interaction during long reading sessions

This text selection model creates precise, contextual interaction that enhances the AI collaboration workflow without disrupting reading flow, fully supporting the "Invisible Interface" principle.

---

## 9. Professional Typography & Text Balance

### Heading Typography Standards
-   **Principle:** All headings should use balanced text wrapping to prevent widow words and create visually pleasing line breaks.
-   **Implementation:** `text-wrap: balance` with appropriate `max-inline-size` constraints (15-20 character units).
-   **Rationale:** Widow words (single words on their own line) create unprofessional appearance and break reading flow. Modern CSS provides automated solutions that are superior to manual intervention.

### Progressive Enhancement Strategy
-   **Primary Experience:** Chrome, Edge, Firefox users receive automatic browser-calculated text balancing
-   **Fallback Experience:** Safari users receive character-width constraints that prevent extreme line lengths
-   **Future-Proof:** Implementation automatically upgrades when Safari adds `text-wrap: balance` support

### Technical Specifications
-   **Global Rule:** All headings (`h1-h6`) have `text-wrap: balance` and `max-inline-size: 20ch`
-   **Hero Titles:** Tighter constraint of `15ch` with centered alignment for maximum impact
-   **Section Headers:** Standard `20ch` constraint for readability without over-constraint
-   **Character Units:** Use `ch` units instead of pixels for font-relative, accessible sizing

### Typography Hierarchy Requirements
-   **Episode Titles:** Large, centered, tightly constrained (15ch) for dramatic impact
-   **Section Headers:** Medium size, left-aligned, moderately constrained (20ch) for readability
-   **Content Headers:** Smaller, functional sizing with standard balancing
-   **Consistency:** All heading levels follow the same balancing principles regardless of content length

This typography system ensures professional presentation that automatically adapts to different content lengths while maintaining visual hierarchy and reading comfort.

---

## 10. Card & Grid Surfaces (Projects, Episodes, Settings)

### Visual Language
- **Principle:** Cards are **flat by default**; elevation is a hover-only affordance that signals interactivity without adding idle visual noise.
- **Rationale:** Preserves the calm, editorial quality of the interface while providing clear, lightweight feedback on intent.

### Rules
- **Resting State:** `rounded-lg border border-gray-200 bg-white` — no shadows.
- **Hover State:** `hover:shadow-sm` for both active and paused states; active cards may also use `hover:-translate-y-0.5` for subtle lift.
- **Status Semantics:** Prefer minimal status dots/badges over heavy chrome (e.g., green dot for Active, gray for Paused).
- **Actions:** Primary action is the **entire card** (open); secondary settings are not exposed on index cards.
- **Density & Rhythm:** Favor generous padding (`p-6` to `p-8`) and `gap-8` grids for scannability.

### Accessibility
- **Focus:** Visible focus ring (e.g., `focus:ring-2 focus:ring-gray-300`) on card buttons/links.
- **Keyboard:** Entire card is a single interactive element; ensure Enter/Space activate.
- **Contrast:** Maintain readable text contrast for muted/paused states.

### Implementation Notes
- Project Index prototype applies: no default shadow, `hover:shadow-sm`, optional `hover:-translate-y-0.5` for active.
- Keep hover microinteractions consistent with `/project` page cards for continuity.

### Future-Safe Considerations
- Thumbnail/Favicon: Circular avatar area reserved; allow swap to illustrated favicon library later.
- Team/Org Labels: Space reserved for future metadata without changing card grammar.

---

## 11. Editorial Hero Pattern (Project Overview, Episode Intros)

### Pattern Definition
**Editorial Hero** elevates content as the primary visual element while reducing UI chrome to a supporting role. Inspired by Apple News, this pattern creates magazine-quality presentation that feels premium and confident.

### Core Principles
- **Content Dominance**: Content becomes the hero, not the interface wrapper
- **Typography Mixing**: Sans-serif for UI/metadata, serif for editorial content
- **Visual Hierarchy Inversion**: Minimize headers, maximize content prominence
- **Spatial Generosity**: Abundant white space creates premium, calm feeling

### Implementation Rules

#### Visual Hierarchy
- **Primary Header**: Minimized (40px avatar, inline metadata, single line)
- **Content Title**: Large serif typography (4-5rem) with text balancing
- **Pull Quote**: Featured as immediate value hook (1.5-2rem italic serif)
- **Supporting Elements**: Muted, secondary treatment

#### Typography Scale
```
- Episode/Content Titles: text-4xl md:text-5xl font-serif font-bold
- Pull Quotes: text-xl md:text-2xl font-serif italic
- Metadata: text-xs uppercase tracking-wider (gray-500)
- Body Text: text-lg leading-relaxed (primary content)
- Captions: text-sm text-gray-600
```

#### Spacing & Layout
- **Section Dividers**: Thin gradient lines with 16-unit vertical spacing
- **Content Width**: max-w-4xl for optimal reading (vs wider dashboard layouts)
- **Breathing Room**: Generous padding, minimal content density
- **Clear Separation**: Primary → Secondary → Tertiary content zones

#### Motion & Interactions
- **Staggered Reveals**: Content appears in logical sequence (0.2s, 0.4s, 0.6s delays)
- **Subtle Backgrounds**: Light gradients for depth without distraction
- **Number Animations**: Count-up effects for engagement metrics
- **Microinteractions**: Arrow translations, gentle lift effects

### When to Use
- **Content-Heavy Pages**: Project overview, episode details, article presentation
- **Primary Content**: When content should dominate over navigation/UI
- **Premium Positioning**: Surfaces requiring editorial credibility and sophistication
- **Reading Experiences**: Long-form content that benefits from magazine treatment

### When NOT to Use
- **Dense Dashboards**: Complex data tables, multi-column layouts
- **Quick Navigation**: Index pages, search results, administrative interfaces
- **Functional Tools**: Settings, configuration, utility pages

### Implementation Examples

#### Editorial Hero Header
```typescript
// Minimized project header
<header className="flex items-center justify-between mb-12">
  <div className="flex items-center gap-3">
    <AvatarOrb size={40} />
    <div>
      <h1 className="text-lg font-semibold">{project.name}</h1>
      <p className="text-xs uppercase tracking-wider text-gray-500">
        Weekly Intelligence • {sourceCount} Sources • Active
      </p>
    </div>
  </div>
  <Settings />
</header>
```

#### Content Hero Treatment
```typescript
// Episode content as hero
<article className="animate-fade-in-up">
  <div className="flex items-center gap-4 mb-8">
    <span className="text-xs uppercase tracking-wider text-gray-500">Episode 4</span>
    <span className="w-1 h-1 bg-gray-300 rounded-full" />
    <span className="text-xs uppercase tracking-wider text-gray-500">15 min read</span>
  </div>
  
  <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight mb-6 [text-wrap:balance] max-w-[20ch]">
    {episode.title}
  </h2>
  
  <blockquote className="border-l-4 border-gray-900 pl-6 py-4 mb-8">
    <p className="text-xl md:text-2xl font-serif italic text-gray-800 leading-relaxed">
      {pullQuote}
    </p>
  </blockquote>
</article>
```

### Animation Timing Standards
- **Page Load**: 0.5s fade-in for immediate elements
- **Staggered Content**: 0.2s increments for logical content flow
- **Microinteractions**: 300ms transitions for hover states
- **Number Animations**: 1.5s duration for count-up effects

### Accessibility Requirements
- **Text Contrast**: Maintain WCAG AA standards across all typography scales
- **Focus Management**: Clear focus rings on interactive elements
- **Screen Readers**: Proper heading hierarchy and semantic markup
- **Keyboard Navigation**: All interactions accessible via keyboard

This pattern transforms functional pages into editorial experiences while maintaining usability and accessibility standards.

---

## 12. Typography Mixing Strategy

### Philosophy
Strategic mixing of serif and sans-serif typography creates editorial sophistication while maintaining functional clarity. Serif fonts signal premium editorial content; sans-serif handles UI and metadata.

### Font Assignments
- **Serif (Lora/Georgia)**: Episode titles, pull quotes, article headers, editorial content
- **Sans-Serif (Inter/System)**: UI elements, metadata, navigation, form labels, body text

### Hierarchy Rules
```
Editorial Content (Serif):
- h1 (Episode titles): text-4xl md:text-5xl font-serif font-bold
- h2 (Section headers): text-2xl md:text-3xl font-serif font-semibold  
- Pull quotes: text-xl md:text-2xl font-serif italic
- Emphasis content: font-serif when appropriate

Interface Content (Sans-Serif):
- Navigation: text-sm md:text-base font-sans
- Metadata: text-xs uppercase tracking-wider font-sans
- Body text: text-base md:text-lg font-sans leading-relaxed
- Form elements: text-sm font-sans
```

### Implementation Guidelines
- **Clear Context Switching**: Reader should understand when they're reading editorial vs UI content
- **Consistent Applications**: Same content types always use same font treatment
- **Responsive Scaling**: Both fonts scale appropriately across screen sizes
- **Fallback Strategy**: System fonts provide reliable fallbacks

---

## 13. Animation & Motion Standards

### Motion Philosophy
Subtle animation enhances the editorial experience without disrupting reading flow. Motion should feel purposeful, not decorative—reinforcing content hierarchy and user intent.

### Animation Categories

#### Page Load Animations
- **Purpose**: Create sense of content arriving naturally, not appearing abruptly
- **Timing**: 0.5-0.6s duration with ease-out curves
- **Pattern**: Staggered reveals in logical content order

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 0.5s ease-out both; }
.animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
```

#### Microinteractions
- **Purpose**: Provide immediate feedback on user actions
- **Timing**: 300ms transitions for consistency
- **Effects**: Subtle transforms, color changes, shadow appearance

```css
/* Button interactions */
.btn-primary {
  transition: all 300ms ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Arrow translations */
.arrow-icon {
  transition: transform 300ms ease;
}
.group:hover .arrow-icon {
  transform: translateX(4px);
}
```

#### Number & Data Animations
- **Purpose**: Make metrics feel alive and engaging
- **Timing**: 1.5s duration for count-up effects
- **Implementation**: JavaScript-based with smooth increments

```typescript
// Source count animation example
useEffect(() => {
  const target = 47;
  const duration = 1500;
  const steps = 30;
  // ... increment logic
}, []);
```

### Staggered Reveal Pattern
Content should appear in logical reading order with slight delays:

```typescript
// Implementation pattern
<header className="animate-fade-in">
<main className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
<aside className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
<footer className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
```

### Performance Guidelines
- **Prefer CSS**: Use CSS animations over JavaScript when possible
- **60fps Target**: All animations should maintain smooth frame rates
- **Reduced Motion**: Respect `prefers-reduced-motion` for accessibility
- **GPU Acceleration**: Use `transform` and `opacity` for performant animations

### Accessibility Considerations
- **Reduced Motion**: Disable decorative animations for users who prefer less motion
- **Focus States**: Ensure animated elements maintain clear focus indicators
- **Screen Readers**: Animations shouldn't interfere with assistive technology

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-fade-in-up {
    animation: none;
  }
}
```

### When to Animate
- **Page transitions**: Content arriving or sections revealing
- **User feedback**: Buttons, form interactions, state changes
- **Data updates**: Numbers changing, progress indicators
- **Attention direction**: Guiding user focus to important content

### When NOT to Animate
- **Reading content**: Don't animate text while user is reading
- **Frequent interactions**: Avoid animation fatigue on repeated actions
- **Critical actions**: Forms, error states should prioritize clarity over motion
- **Performance constraints**: Disable on low-powered devices if needed

This motion system creates a cohesive, polished experience that enhances rather than distracts from the core content consumption experience.
