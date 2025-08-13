# New Project Conversation Flow - Product Requirements Document

## Overview
Create a conversational interface where Futura guides users through creating a new research project. This should feel like hiring a researcher, not filling out a form.

## Core Requirements

### 1. Technical Architecture
- **Framework**: React with TypeScript
- **State Management**: Simple React state (useState)
- **API Integration**: OpenAI GPT-4o-mini via server proxy
- **Styling**: Tailwind CSS with minimal design

### 2. User Flow
1. User clicks "New Project" 
2. Futura greets them with opening message
3. User describes what future they want to explore
4. Futura asks clarifying questions (2-3 exchanges)
5. Futura offers to create project brief
6. User can accept, edit, or continue shaping
7. Confirmation creates the project

### 3. Component Structure
```
NewProjectConversation
├── Message Display (scrollable conversation)
├── Input Field (always visible at bottom)
├── Project Brief Canvas (appears after conversation)
└── Keyboard Shortcuts (optional overlay)
```

### 4. API Design

#### Client-Server Communication
- POST `/api/project-conversation`
- Request: `{ messages: Array<{role: string, content: string}> }`
- Response: Server-Sent Events (SSE) stream
- Use native fetch API with SSE parsing

#### Server Implementation
- Express server on port 3001
- OpenAI streaming with system prompt
- Proper SSE formatting with `data: ` prefix

### 5. State Management
```typescript
interface ConversationState {
  messages: Message[]
  isLoading: boolean
  input: string
  showBrief: boolean
  projectBrief: ProjectBrief | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ProjectBrief {
  title: string
  brief: string
}
```

### 6. Key Features

#### Message Handling
- Display user and assistant messages
- Show typing indicator during streaming
- Maintain conversation history
- Auto-scroll to latest message

#### Input Management
- Single-line input field
- Submit on Enter
- Clear after sending
- Disable during streaming

#### Brief Generation
- Detect when Futura offers to create brief
- Extract and display in canvas format
- Allow inline editing
- Confirm to create project

### 7. Design Specifications
- **Typography**: Lora for Futura, sans-serif for user
- **Colors**: Minimal grayscale palette
- **Layout**: Centered, max-width 640px
- **Animations**: Subtle fade-ins
- **Mobile**: Responsive design

### 8. Error Handling
- Network errors: Show inline error message
- API failures: Graceful fallback
- Empty responses: Retry logic
- Timeout: 30 second maximum

### 9. Keyboard Shortcuts
- Enter: Send message
- Escape: Exit conversation
- Tab: Edit brief (when shown)
- Cmd+K: Show shortcuts

## Implementation Plan

### Phase 1: Basic Conversation
1. Create new component from scratch
2. Implement message display
3. Add input field with submit
4. Test with mock responses

### Phase 2: API Integration
1. Set up SSE client
2. Connect to server endpoint
3. Handle streaming responses
4. Add error handling

### Phase 3: Brief Generation
1. Detect brief trigger phrases
2. Display brief canvas
3. Implement editing
4. Add confirmation flow

### Phase 4: Polish
1. Add animations
2. Implement keyboard shortcuts
3. Mobile optimization
4. Final testing

## Success Criteria
- User can have natural conversation with Futura
- Responses stream in real-time
- Brief generation feels seamless
- No duplicate messages or lost content
- Works on desktop and mobile

## Non-Goals
- Chat history persistence
- Multiple conversation threads
- File attachments
- Complex formatting