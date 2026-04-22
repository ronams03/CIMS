# Task 5-d: Risk Signals View Component

## Summary
Built the full `RiskSignalsView` component at `/src/components/risk-signals-view.tsx`. This is a "use client" component that displays risk & compliance signals for procurement data.

## What was done
Replaced the placeholder skeleton component with a comprehensive implementation that includes:

1. **Severity Summary Cards** — 4 cards in a row (critical/red, high/orange, medium/yellow, low/emerald), each showing count, percentage of total, and a severity-specific icon (AlertOctagon, AlertTriangle, Shield, Eye).

2. **Filter Bar** — Two Select dropdowns for severity and signal type filtering, plus a "Clear Filters" button that appears only when filters are active. Filters trigger re-fetching via react-query queryKey changes.

3. **Signal Distribution Charts** — Two side-by-side charts:
   - Horizontal BarChart showing signal counts by type (sole-source, scope-creep, timing-irregularity, concentration)
   - Donut/PieChart showing severity distribution with legend
   - Both use ChartContainer, ChartTooltip, ChartTooltipContent from the shadcn/ui chart component

4. **Risk Signals List** — Scrollable list (max-h-[600px]) sorted by severity (critical → high → medium → low). Each signal card shows:
   - Severity badge (color-coded)
   - Signal type badge (color-coded per type)
   - Description text
   - Contract reference with clickable contractId
   - Agency name, contractor name, and created date
   - Resolved/unresolved status indicator (green/red dot)

5. **Signal Type Descriptions** — Info section at bottom with explanations for each signal type.

## Technical details
- Uses `@tanstack/react-query` useQuery with dynamic queryKey based on filters
- Uses recharts (BarChart, PieChart, Cell) for charts
- Uses shadcn/ui components: Card, Badge, Button, Select, Skeleton, ScrollArea, Separator, ChartContainer/ChartTooltip/ChartTooltipContent
- Uses lucide-react icons: AlertTriangle, Shield, AlertOctagon, Clock, Eye, Filter, X, Info
- Uses date-fns for date formatting
- Loading state with comprehensive skeleton layout
- Error state with destructive alert
- Empty state with informative message
- Responsive design (grid-cols-2 on mobile, lg:grid-cols-4 for cards, sm:grid-cols-2 for info section)
- Lint passes cleanly with no errors
