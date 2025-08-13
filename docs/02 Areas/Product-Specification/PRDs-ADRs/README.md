# PRDs and ADRs - Current UI Components

This folder contains the most recent Product Requirements Documents (PRDs) and Architecture Decision Records (ADRs) for the core UI components being actively developed.

## Core Pages

### Homepage
- **PRD**: [homepage-prd.md](./homepage-prd.md) - Landing experience after auth, project navigation
- **ADR**: [18-homepage-architecture.md](./18-homepage-architecture.md) - SSR/ISR hybrid approach

### Project Detail Page  
- **PRD**: [project-detail-prd.md](./project-detail-prd.md) - Project hub with editorial episode layout
- **ADR**: [19-project-detail-architecture.md](./19-project-detail-architecture.md) - Hybrid SSR/client architecture

### Episode Reader
- **PRD**: [episode-reader-prd.md](./episode-reader-prd.md) - Premium reading experience
- **ADR**: [20-episode-reader-architecture.md](./20-episode-reader-architecture.md) - Progressive enhancement approach

## Design Principles

All pages follow these core principles:
1. **Editorial over Functional** - More like Monocle/Wired than Notion/Jira
2. **Premium Typography** - Serif fonts for titles, generous spacing
3. **Content Focus** - UI disappears, content takes center stage
4. **Progressive Enhancement** - Fast SSR, enhanced with client features
5. **Mobile-First Responsive** - Works beautifully on all devices

## Current Status

- ✅ Homepage PRD & ADR complete
- ✅ Project Detail page redesigned with hero episode pattern
- ✅ Episode Reader PRD & ADR complete
- 🚧 Implementation in progress

## References

- [Design Language Document](../../01 Projects/Many Futures/design-language.md)
- [Development Diary](../../../00 Index/development-diary.md)
- [CLAUDE.md Strategy](../claude-md-strategy.md)