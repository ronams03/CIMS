# Task 5-c: Relationships View Component

## Summary
Built the full interactive Relationships View component (`/src/components/relationships-view.tsx`) with an SVG-based network graph visualization, replacing the previous skeleton placeholder.

## What was implemented

### 1. Summary Cards Row (3 cards)
- **Total Entities** — shows agency + contractor count with breakdown
- **Total Connections** — shows total edges with agency-contractor vs contractor-sub breakdown
- **High-Risk Contractors** — counts contractors with riskScore > 60

### 2. SVG Network Graph (custom, no external library)
- Circular layout: agencies in inner circle, contractors in outer circle
- Trigonometric positioning for even distribution
- Edges rendered as SVG `<line>` elements:
  - Agency-contractor edges: solid emerald lines, thickness based on normalized weight
  - Contractor-subcontractor edges: dashed amber lines, thinner
- Node styling:
  - Agencies: emerald-filled circles with white text label
  - Contractors: circles filled by risk score (emerald/amber/orange/red gradient)
- Interactive features:
  - **Hover**: highlights connected nodes/edges, dims unrelated elements
  - **Click**: selects a node, shows animated selection ring, opens detail panel
  - **Tooltip**: shows entity name, type, risk score, connection count on hover
- Responsive dimensions via ResizeObserver

### 3. Detail Panel (right side)
- Shows entity name, type, and icon
- For agencies: code, category
- For contractors: risk score with Progress bar (color-coded), industry, registration, location
- Connected entities list (clickable to navigate within graph)
- Close button to deselect

### 4. Risk Score Legend
- Visual legend below the graph
- Color mapping: Low (0-30, emerald), Medium (30-50, amber), High (50-70, orange), Critical (70-100, red)
- Edge type indicators (solid vs dashed)

### 5. Contractor Risk Table
- All contractors sorted by risk score descending
- Columns: Name, Industry (hidden on small), Risk Score (color-coded Badge), Location (hidden on small), Connections count
- Clickable rows to select node in graph
- ScrollArea with max-h-96
- Selected row highlighting

## Technical Details
- Uses `@tanstack/react-query` `useQuery` for data fetching from `/api/relationships`
- React state: `selectedNode`, `hoveredNode`, `tooltipInfo`
- shadcn/ui components: Card, Badge, Table, Skeleton, Progress, ScrollArea
- lucide-react icons: Network, Users, Shield, AlertTriangle, Building2, MapPin, Link2, X
- Teal/emerald color scheme (no indigo/blue)
- Currency formatting with Intl.NumberFormat compact notation
- CSS transitions for hover/selection states
- Animated selection ring on selected nodes (SVG animate)
- Loading state with Skeleton placeholders
- Error state with AlertTriangle icon
