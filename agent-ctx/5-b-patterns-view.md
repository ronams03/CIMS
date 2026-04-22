# Task 5-b: Patterns View Component

## Summary
Built the full `PatternsView` component at `/src/components/patterns-view.tsx`, replacing the placeholder skeleton with a fully functional pattern & anomaly detection view.

## What was built

### Component: `PatternsView`
A `"use client"` component that fetches data from `GET /api/patterns` using `@tanstack/react-query` and renders 5 sections:

1. **KPI Cards Row** (4 cards):
   - **Sole-Source Rate**: Shows percentage, colored orange if >20%
   - **Q4 Award Spike**: Shows % of awards in Q4, colored amber if endOfYearSpike
   - **Scope Creep Cases**: Count of contracts with >30% growth
   - **Avg. Growth Rate**: Average growth across scope creep contracts, color-coded by severity

2. **Persistent Winners Section**:
   - Accordion-based layout grouped by category
   - Each category shows a horizontal BarChart (recharts BarChart with layout="vertical")
   - Color-coded by category using teal/emerald palette
   - Below each chart: contractor name, win rate, and total value

3. **Timing Analysis Section**:
   - Quarterly Distribution bar chart (Q1-Q4)
   - Q4 bar highlighted with amber color if spike detected
   - Summary stats cards for Q4 and December contract counts/percentages
   - Small table listing recent Q4 contracts (scrollable, max-h-40)

4. **Scope Creep Section**:
   - Table with columns: Contract ID, Title, Original Value, Current Value, Growth %, Modification Count, Expand toggle
   - Growth % color-coded: red if >50%, orange if 30-50%
   - Collapsible rows showing modification history with mod number, description, date, and value change
   - Progress bar showing severity distribution
   - Empty state when no scope creep detected

5. **Award Method Distribution Section**:
   - Donut/Pie chart of overall award method distribution
   - Detailed breakdown list with color indicators, contract counts, and percentage badges
   - Warning banner when sole-source rate exceeds 20%

### Technical details
- Uses `@tanstack/react-query` useQuery for data fetching
- Uses recharts: BarChart, PieChart, Cell, XAxis, YAxis
- Uses ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent from `@/components/ui/chart`
- Uses shadcn/ui: Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, Skeleton, Progress, Accordion, Collapsible
- Uses lucide-react: TrendingUp, Clock, AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp, Shield
- Teal/emerald color scheme throughout (no indigo/blue)
- Currency formatting with Intl.NumberFormat
- Full loading skeleton state
- Error state with AlertTriangle icon
- Responsive grid layouts (md:grid-cols-2, lg:grid-cols-4)

## Files modified
- `/src/components/patterns-view.tsx` — Complete rewrite from placeholder to full implementation

## API dependency
- `GET /api/patterns` — Already exists and returns the expected data structure

## Lint result
- Passed cleanly with no errors
