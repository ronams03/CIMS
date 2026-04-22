# Task 5-a: Contracts View Component

## Summary
Built the full `ContractsView` component at `/src/components/contracts-view.tsx`. This is a comprehensive, searchable, filterable contract database view with all requested features.

## What was built

### Features Implemented
1. **Search Bar** - Debounced (300ms) search input that filters by contract ID, title, or description
2. **Filter Dropdowns** - Three Select components for Category, Award Method, and Status with "All" options
3. **Stats Row** - Shows total contracts found and total value of displayed results, plus a "Clear filters" button when filters are active
4. **Contract Table** with all specified columns:
   - Contract ID (font-mono)
   - Title (truncated with line-clamp)
   - Agency (hidden on < lg screens)
   - Contractor (hidden on < md screens)
   - Category (with muted Badge)
   - Value (formatted currency, shows both initial and obligated when different)
   - Award Method (colored Badge: competitive=emerald, sole-source=amber, emergency=red)
   - Status (colored Badge: active=emerald, completed=gray, terminated=red, modified=amber)
   - Modifications count (hidden on < lg screens)
   - Risk signals count (AlertTriangle icon in orange when >0)
5. **Pagination** - Previous/Next buttons with page info, disabled states
6. **Contract Detail Dialog** - Clicking any row opens a Dialog showing:
   - Full contract details in a 2-column grid
   - Value change indicator (when obligated != initial)
   - List of modifications with value changes
   - List of subcontractors with sub-values
   - Risk signals with severity badges and descriptions
7. **Loading state** - Full skeleton component matching the table structure
8. **Empty state** - Shown when no results match, with clear filters button
9. **Error state** - AlertTriangle icon with error message

### Technical Details
- Uses `@tanstack/react-query` `useQuery` for both the list and detail fetches
- API: `GET /api/contracts` with query params (search, category, awardMethod, status, page, limit)
- API: `GET /api/contracts/[id]` for detail dialog
- Debounced search using `useEffect` with 300ms timeout
- `useCallback` for filter change handlers to prevent unnecessary re-renders
- Responsive design: columns progressively hidden on smaller screens
- Teal/emerald accent colors throughout (no indigo/blue)
- Currency formatting with `Intl.NumberFormat` (full and compact)
- Date formatting using `toLocaleDateString` with "short" month format
- All shadcn/ui components used: Card, Input, Select, Button, Badge, Table, Dialog, Skeleton, Separator

### Existing code reviewed
- Read existing API routes (`/api/contracts/route.ts` and `/api/contracts/[id]/route.ts`)
- Read existing placeholder `contracts-view.tsx` and replaced it
- Reviewed `dashboard-view.tsx` for patterns and style consistency
- Reviewed Prisma schema for data structure understanding

### Lint & Dev Server
- ESLint passes with no errors
- Dev server compiles successfully with no issues
