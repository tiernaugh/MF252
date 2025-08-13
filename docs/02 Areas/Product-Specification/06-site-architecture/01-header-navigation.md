# Site Architecture: Header & Navigation

This document outlines the principles and implementation details for the site-wide header and navigation, ensuring a consistent, clean, and focused user experience.

## 1. Core Principles

-   **Focus on Content:** The primary goal of the header is to provide essential context without distracting from the main content. It should feel lightweight and unobtrusive.
-   **Clear Information Hierarchy:** A clear distinction must be maintained between global navigation (site-level) and contextual information (episode-level).
-   **Progressive Disclosure:** Reveal secondary information (like project context) on user interaction (hover) to keep the default view clean.

## 2. MVP Header Implementation

Based on the prototype refinements, the MVP header will consist of two main parts:

### 2.1. Top Navigation Bar

A slim, persistent bar at the very top of the page.

-   **Left Side:** A single, refined "Home" icon/logo that links back to the user's main dashboard. This replaces the full project title to reduce clutter.
-   **Center:** The "researched by Futura" branding element.
-   **Right Side:** User avatar and account settings menu.

### 2.2. Episode Title Block

The main title block that introduces the content.

-   **"Episode X" Pill:** This remains as the primary context anchor.
-   **Project Context (on Hover):** The name of the project ("AI impact on design consultancy") will be hidden by default. It will appear directly above the "Episode X" pill when the user hovers over the pill, providing context without cluttering the initial view.
-   **Main Title:** The large, Lora-font title remains the primary focal point.
-   **Subtitle:** The descriptive subtitle in Inter font.
-   **Published Date:** The "8 min read" text will be replaced with the formatted publication date (e.g., "Tuesday, 01 August 2025"). This provides more valuable temporal context.

## 3. Data Schema Requirements

To support this structure, the `Episode` data object requires:

-   `publishedDate`: An ISO 8601 date string.
-   `project.name`: The name of the project the episode belongs to.
-   `accessControl`: An array of objects to define user/team access (for future use).
    -   `{ type: 'user', id: 'user_clerk_id' }`
    -   `{ type: 'team', id: 'team_id' }`

This structure ensures a clean, focused, and scalable header design.
