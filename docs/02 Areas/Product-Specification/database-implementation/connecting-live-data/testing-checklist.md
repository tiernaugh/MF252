# Testing Checklist: Live Data Connection

## Pre-Testing Setup

### Environment Check
- [ ] Database URL configured in `.env`
- [ ] Test organization exists in database
- [ ] Test user exists in database  
- [ ] Test project with episodes exists
- [ ] Build passes: `pnpm build`

### Verify Test Data
```bash
# Run test queries
tsx src/server/actions/test-queries.ts

# Expected output:
✓ Organization: Test User's Workspace
✓ Users: 1
✓ Projects: 1+
✓ Episodes: 2+
```

## Functional Testing

### 1. Projects List Page (`/projects`)

#### Data Loading
- [ ] Page loads without errors
- [ ] Projects appear from database
- [ ] Correct project count shows
- [ ] Project cards display all fields:
  - [ ] Title
  - [ ] Description
  - [ ] Status indicator
  - [ ] Episode count
  - [ ] Next scheduled date
  - [ ] Avatar initials

#### Interactions
- [ ] Search filters projects correctly
- [ ] Sort options work:
  - [ ] Last published
  - [ ] Next episode
  - [ ] A-Z
- [ ] Status filters work:
  - [ ] All
  - [ ] Active
  - [ ] Paused
- [ ] Click project navigates to detail

#### Edge Cases
- [ ] Empty state when no projects
- [ ] Handles paused projects correctly
- [ ] Shows "NEW" badge for recent episodes

### 2. Project Detail Page (`/projects/[id]`)

#### Data Loading
- [ ] Page loads without errors
- [ ] Project information displays
- [ ] Episodes list loads
- [ ] Correct episode count
- [ ] Memory pills display (if any)

#### Interactions
- [ ] Settings button works
- [ ] Pause/Resume toggles correctly
- [ ] Episode cards clickable
- [ ] Upcoming episode preview shows

#### Edge Cases
- [ ] Handles project not found (404)
- [ ] Empty episodes state
- [ ] Invalid project ID

### 3. Episode Reader (`/episodes/[id]`)

#### Data Loading
- [ ] Page loads without errors
- [ ] Episode content displays
- [ ] Title and metadata show
- [ ] Reading time accurate
- [ ] Sources list appears

#### Interactions
- [ ] Feedback buttons work
- [ ] Copy link works
- [ ] Navigation back works
- [ ] Auto-hide nav on scroll

#### Edge Cases
- [ ] Handles episode not found
- [ ] Long content scrolls properly
- [ ] Invalid episode ID

### 4. Project Settings (`/projects/[id]/settings`)

#### Data Loading
- [ ] Current settings load
- [ ] Schedule displays correctly
- [ ] All form fields populated

#### Interactions
- [ ] Can modify schedule
- [ ] Save button persists changes
- [ ] Cancel reverts changes
- [ ] Success message shows
- [ ] Redirects after save

#### Validation
- [ ] Required fields enforced
- [ ] Invalid data prevented
- [ ] Error messages clear

### 5. New Project Creation (`/projects/new`)

#### Conversation Flow
- [ ] Initial prompt works
- [ ] AI responds appropriately
- [ ] Multiple turns possible
- [ ] Brief generation triggers

#### Database Save
- [ ] Project saves to database
- [ ] Brief content preserved
- [ ] Redirects to new project
- [ ] Project appears in list

#### Edge Cases
- [ ] Handles API errors gracefully
- [ ] Long conversations work
- [ ] Network interruption handling

## Performance Testing

### Load Times
- [ ] Projects list < 2s
- [ ] Project detail < 2s
- [ ] Episode reader < 2s
- [ ] No visible loading jumps

### Database Queries
- [ ] No N+1 query problems
- [ ] Joins working efficiently
- [ ] Indexes being used

### Memory Usage
- [ ] No memory leaks
- [ ] Proper cleanup on navigation
- [ ] Browser stays responsive

## Type Safety

### TypeScript Checks
```bash
pnpm typecheck
```
- [ ] No type errors
- [ ] All imports resolved
- [ ] Server/client boundaries correct

### Build Verification
```bash
pnpm build
```
- [ ] Build completes successfully
- [ ] No warnings about missing data
- [ ] Bundle size reasonable

## Error Handling

### Database Errors
- [ ] Connection failure handled
- [ ] Query timeout handled
- [ ] Invalid data handled

### User Feedback
- [ ] Error messages user-friendly
- [ ] Loading states visible
- [ ] Success confirmations clear

### Logging
- [ ] Errors logged to console
- [ ] Database queries tracked
- [ ] Performance metrics captured

## Security Checks

### Data Scoping
- [ ] All queries filter by organizationId
- [ ] No data leakage between orgs
- [ ] Soft deletes respected

### Input Validation
- [ ] User input sanitized
- [ ] SQL injection prevented
- [ ] XSS prevention working

## Regression Testing

### Mock Data Removal
- [ ] No mock data imports remain
- [ ] All data from database
- [ ] Mock data file can be deleted

### Feature Parity
- [ ] All features still work
- [ ] No functionality lost
- [ ] UI behavior unchanged

## Browser Testing

### Desktop Browsers
- [ ] Chrome/Edge
- [ ] Safari
- [ ] Firefox

### Mobile Responsive
- [ ] Mobile layout works
- [ ] Touch interactions work
- [ ] Scroll behavior correct

## Documentation

### Code Documentation
- [ ] Server actions documented
- [ ] Complex queries explained
- [ ] Type transformations noted

### User Impact
- [ ] No user-visible changes
- [ ] Performance same or better
- [ ] All features accessible

## Sign-off Checklist

Before marking complete:
- [ ] All tests pass
- [ ] No console errors
- [ ] Build successful
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Performance acceptable

## Post-Deployment Monitoring

After deployment:
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Verify data persistence
- [ ] User feedback positive

---

**Testing Started:** ___________  
**Testing Completed:** ___________  
**Tested By:** ___________  
**Issues Found:** ___________  
**Resolution:** ___________