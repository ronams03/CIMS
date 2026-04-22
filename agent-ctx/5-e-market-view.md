# Task 5-e: Market Intelligence View Component

## Agent: market-view-builder

## Summary
Built the full Market Intelligence View component (`/src/components/market-view.tsx`) — a comprehensive "use client" component that shows market intelligence & competitive analysis for procurement.

## What was created

### File: `/src/components/market-view.tsx`

A complete market intelligence dashboard with 6 major sections:

1. **Category Overview Cards** — A responsive grid of cards (1/2/4 columns) showing each category's name, total value, contract count, and avg value. Cards are color-coded with left border accents per category (emerald/teal/amber/cyan). Each card has a contextual icon from lucide-react.

2. **Market Share by Category** — Uses shadcn/ui Tabs component with dynamically generated category tabs. Each tab shows:
   - A vertical BarChart (recharts) of top 8 contractors by total value
   - A side panel with win rate progress bars for each contractor
   - Custom tooltip with currency formatting

3. **Win Rate Rankings** — Full-width table of top 20 contractors sorted by win rate descending:
   - Columns: Rank, Contractor, Category, Win Rate (with Progress bar + percentage), Total Value, Contract Count
   - Top 3 highlighted with gold/silver/bronze badges (🥇🥈🥉)
   - Top 3 rows have subtle background highlight
   - Responsive: hides columns on smaller screens

4. **Total Contract Value by Contractor** — Horizontal bar chart showing top 15 contractors by value:
   - Bars colored by risk score: emerald (low 0-30), amber (medium 31-60), red (high 61-100)
   - Risk legend with color swatches
   - Below-chart list with risk score badges per contractor

5. **Category Value Distribution** — Donut/Pie chart showing spending distribution:
   - Percentage labels on slices (hides slices < 5%)
   - Custom tooltip showing value + percentage
   - Dynamic legend from data
   - Dynamic chart config built from category names

6. **Competitive Positioning Matrix** — Scatter plot (advanced section):
   - X = Win Rate, Y = Total Value, Z (bubble size) = Contract Count
   - Each dot colored by industry
   - Custom HTML tooltip showing contractor details
   - Custom legend showing industry color groups with deduplication

## Technical details

- **Data fetching**: Uses `@tanstack/react-query` `useQuery` with `["market"]` query key
- **API**: `GET /api/market` — already existed, returns marketShareByCategory, winRateRankings, totalContractValueByContractor, categoryStatistics
- **Charts**: All use ChartContainer/ChartTooltip/ChartTooltipContent/ChartLegend from `@/components/ui/chart` wrapping recharts primitives
- **Color scheme**: Teal/emerald/amber (no indigo/blue), consistent with the existing dashboard
- **Currency formatting**: Uses Intl.NumberFormat for both full and compact notation
- **Loading state**: Full skeleton component matching the layout structure
- **Error state**: Card with Target icon and error message
- **Responsive**: Mobile-first with responsive grid breakpoints, hidden columns on small screens
- **Lint**: Passes clean with no warnings

## Dependencies used
- recharts: BarChart, PieChart, ScatterChart, Cell, XAxis, YAxis, ZAxis, Tooltip, Legend
- shadcn/ui: Card, Tabs, Badge, Table, Skeleton, Progress, Separator
- lucide-react: BarChart3, Trophy, Target, TrendingUp, DollarSign, Users
- @tanstack/react-query: useQuery
