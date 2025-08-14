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

### TypeScript Best Practices for Components

#### Props Type Safety
```tsx
// ❌ BAD - No type safety
const Component = ({ title, items }) => {
  return <div>{items[0]}</div>;  // Could be undefined
};

// ✅ GOOD - Properly typed props
interface ComponentProps {
  title: string;
  items: string[];
  defaultItem?: string;
}

const Component = ({ title, items, defaultItem = "No items" }: ComponentProps) => {
  return <div>{items[0] ?? defaultItem}</div>;
};
```

#### Event Handler Types
```tsx
// ❌ BAD - Implicit any
const handleClick = (e) => {
  console.log(e.target.value);
};

// ✅ GOOD - Properly typed events
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget.value);
};

// ✅ GOOD - Form events
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};
```

#### State Type Safety
```tsx
// ❌ BAD - Implicit types
const [data, setData] = useState(null);

// ✅ GOOD - Explicit types
const [data, setData] = useState<string | null>(null);

// ✅ GOOD - Complex types
interface ProjectData {
  id: string;
  title: string;
}
const [project, setProject] = useState<ProjectData | null>(null);
```

### Common Mistakes to Avoid
1. Forgetting to add serif font to new headings
2. Using shadow-lg instead of shadow-xl
3. Using -translate-y-0.5 instead of -translate-y-1
4. Mixing border-stone-200 with border-stone-300
5. **Not typing component props interfaces**
6. **Using implicit any for event handlers**
7. **Array access without null checks in JSX**
8. **Not running `pnpm typecheck` before committing**

## Conversational UI Patterns (Critical for Project Creation)

### Input Clearing Best Practice
```typescript
// ❌ BAD - Clears after async operation (slow UX)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await sendMessage(input);
  setInput(""); // User sees old text during API call
};

// ✅ GOOD - Clear immediately (responsive UX)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const message = input.trim();
  setInput(""); // Clear immediately
  await sendMessage(message);
};
```

### Auto-Scroll Pattern
```typescript
// Essential for conversational interfaces
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isLoading, phase]); // Scroll on any conversation change

// At bottom of messages container:
return (
  <div>
    {messages.map(msg => <MessageComponent key={msg.id} {...msg} />)}
    {isLoading && <TypingIndicator />}
    <div ref={messagesEndRef} /> {/* Invisible scroll target */}
  </div>
);
```

### ContentEditable Click-to-Edit Pattern
```typescript
// Handle click-to-edit functionality (for BriefCanvas)
const [isEditing, setIsEditing] = useState(false);
const contentRef = useRef<HTMLDivElement>(null);

const handleClick = () => {
  setIsEditing(true);
  setTimeout(() => {
    contentRef.current?.focus();
    // Place cursor at end
    const range = document.createRange();
    range.selectNodeContents(contentRef.current!);
    range.collapse(false);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  }, 0);
};

const handleBlur = () => {
  setIsEditing(false);
  onSave(title, contentRef.current?.textContent || '');
};

return (
  <div 
    ref={contentRef}
    contentEditable={isEditing}
    onClick={handleClick}
    onBlur={handleBlur}
    className={`${isEditing ? 'outline-none ring-2 ring-stone-300' : 'cursor-pointer hover:bg-stone-50'}`}
    suppressContentEditableWarning
  >
    {brief}
  </div>
);
```

### Dynamic Layout Transitions
```typescript
// Shift from center to top as conversation grows
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (messages.length > 1 && containerRef.current) {
    containerRef.current.style.justifyContent = 'flex-start';
    containerRef.current.style.paddingTop = '6rem';
  }
}, [messages.length]);

// CSS classes for smooth transitions
<div 
  ref={containerRef}
  className="min-h-screen flex flex-col justify-center items-center transition-all duration-700 ease-out pb-20"
>
```

### Focus Management
```typescript
// Focus input after responses, but not during brief phase
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (phase !== 'brief_generated' && !isLoading && inputRef.current) {
    inputRef.current.focus();
  }
}, [phase, isLoading, messages]);

// Prevent focus during loading states
<input
  ref={inputRef}
  disabled={isLoading}
  className="w-full bg-transparent border-b border-stone-200 pb-2 outline-none"
/>
```

### Brief Data Structure Handling
```typescript
// Always handle multiple data structure formats
<BriefCanvas
  title={projectBrief.title}
  brief={
    projectBrief.brief || 
    (projectBrief as any).content || 
    'Brief content not found'
  }
  onSave={saveBrief}
  showTypewriter={true}
/>

// Debug logging when debugging brief issues
{projectBrief && (
  <>
    {console.log('Rendering BriefCanvas with:', { 
      title: projectBrief.title, 
      brief: projectBrief.brief,
      fullObject: projectBrief 
    })}
    <BriefCanvas {...props} />
  </>
)}
```

### Component Checklist
Before creating a new component:
- [ ] Does it follow the serif heading pattern?
- [ ] Are hover states consistent (shadow-xl, -translate-y-1)?
- [ ] Is padding generous enough (p-8 for cards)?
- [ ] Are transitions 300ms?
- [ ] Does it use white background (not stone-50)?
- [ ] **Are all props properly typed with interfaces?**
- [ ] **Are event handlers typed correctly?**
- [ ] **Does it handle undefined/null cases?**
- [ ] **No TypeScript errors when running `pnpm typecheck`?**
- [ ] **For conversational UI: Input clears immediately?**
- [ ] **For conversational UI: Auto-scroll implemented?**
- [ ] **For editable content: Click-to-edit with proper focus?**