# Component Development Context

## Design System (Unified Editorial)

### Core Principles
- **Editorial sophistication** - Like The Economist, not like Notion
- **Serif typography for headings** - Creates visual hierarchy
- **White backgrounds** - Premium publication feel
- **Generous padding** - p-8 for cards, py-16 for hero sections

### Component Patterns

#### Cards
```tsx
<Card className="bg-white border border-stone-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
  <CardContent className="p-8">
    <h3 className="font-serif text-2xl font-semibold text-stone-900 mb-3">
      {title}
    </h3>
    <p className="text-base text-stone-600 leading-relaxed">
      {description}
    </p>
  </CardContent>
</Card>
```

#### Buttons
```tsx
// Primary
<Button className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3">

// Secondary
<Button variant="outline" className="border-stone-300 hover:bg-stone-50">

// Ghost
<Button variant="ghost" className="hover:bg-stone-50">
```

#### Activity Indicators
```tsx
// NEW badge
<Badge className="bg-blue-100 text-blue-700 border-0 text-xs uppercase tracking-wider">
  NEW
</Badge>

// Status dots
<div className={`w-3 h-3 rounded-full ${active ? 'bg-green-500' : 'bg-stone-300'}`} />
```

### Typography Rules
1. **All major headings use font-serif**
2. **Metadata uses uppercase tracking-wider**
3. **Body text uses font-sans for UI, font-serif for reading**
4. **Consistent sizes: 4-5xl hero, 2-3xl cards, xl subsections**

### Animation Standards
- **Hover lift**: -translate-y-1 (4px)
- **Shadows**: shadow-xl on hover
- **Transitions**: 300ms throughout
- **Easing**: ease (not linear)

### What NOT to Do
- ❌ Mix stone-50 and white backgrounds randomly
- ❌ Use sans-serif for major headings
- ❌ Create new animation timings (stick to 300ms)
- ❌ Use badges instead of dots for status
- ❌ Add icons without clear purpose

### Common Mistakes to Avoid
1. Forgetting to add serif font to new headings
2. Using shadow-lg instead of shadow-xl
3. Using -translate-y-0.5 instead of -translate-y-1
4. Mixing border-stone-200 with border-stone-300

### Component Checklist
Before creating a new component:
- [ ] Does it follow the serif heading pattern?
- [ ] Are hover states consistent (shadow-xl, -translate-y-1)?
- [ ] Is padding generous enough (p-8 for cards)?
- [ ] Are transitions 300ms?
- [ ] Does it use white background (not stone-50)?