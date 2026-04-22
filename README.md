# ContractSurface — Public Contract Intelligence System

A full-stack web application for aggregating, analyzing, and visualizing public procurement data. ContractSurface provides universal contract aggregation, pattern and anomaly detection, relationship mapping, competitive/market intelligence, and risk/compliance signal tracking — all in a modern, responsive dark-mode UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript 5 |
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York style) |
| **Database** | SQLite via Prisma ORM |
| **State Management** | TanStack React Query (server state) + Zustand (client state) |
| **Charts** | Recharts with shadcn/ui ChartContainer |
| **UI Components** | 50+ shadcn/ui components (Radix UI primitives) |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Theme** | next-themes (light/dark mode toggle) |
| **Forms** | React Hook Form + Zod validation |
| **Date Utilities** | date-fns |

---

## Prerequisites

- **Node.js** ≥ 18 or **Bun** runtime
- **npm** or **bun** package manager

---

## How to Run

### 1. Install dependencies

```bash
bun install
```

### 2. Set up the database

The project uses SQLite with Prisma. The database file is stored at `db/custom.db` (configured in `.env`).

```bash
# Push the Prisma schema to create tables
bun run db:push

# (Optional) Generate Prisma Client
bun run db:generate
```

### 3. Start the development server

```bash
bun run dev
```

The app runs on **http://localhost:3000** by default. Open it in your browser to use the application.

### 4. Lint the code

```bash
bun run lint
```

---

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema (7 models)
├── db/
│   └── custom.db              # SQLite database file
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main page (sidebar + view routing)
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── api/               # REST API routes
│   │       ├── dashboard/     # Dashboard KPIs & chart data
│   │       ├── contracts/     # CRUD + detail + modifications + resolve-signal
│   │       ├── patterns/      # Pattern detection analytics
│   │       ├── relationships/ # Network graph data
│   │       ├── risk-signals/  # Risk signal queries
│   │       ├── market/        # Market intelligence data
│   │       ├── agencies/      # Agency lookup
│   │       └── contractors/   # Contractor lookup
│   ├── components/
│   │   ├── app-sidebar.tsx    # Collapsible sidebar navigation
│   │   ├── dashboard-view.tsx # Dashboard with KPIs, charts, tables
│   │   ├── contracts-view.tsx # Contract database with CRUD
│   │   ├── patterns-view.tsx  # Pattern detection visualizations
│   │   ├── relationships-view.tsx # Interactive network graph
│   │   ├── risk-signals-view.tsx  # Risk signal tracking
│   │   ├── market-view.tsx    # Market intelligence dashboard
│   │   ├── theme-provider.tsx # Dark/light theme provider
│   │   ├── query-provider.tsx # React Query provider
│   │   └── ui/                # 50+ shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       └── db.ts              # Prisma client singleton
├── .env                       # Environment variables
├── package.json
└── README.md
```

---

## Database Schema

The system uses **7 Prisma models** with full relational integrity:

| Model | Description |
|---|---|
| **Agency** | Government agencies that award contracts (name, code, level, category, budget) |
| **Contractor** | Companies that hold contracts (name, registration, industry, risk score) |
| **Contract** | Core contract records (value, status, award method, dates, agency/contractor relations) |
| **ContractModification** | Modifications to contracts (value changes, reasons, mod numbers) |
| **SubcontractorLink** | Subcontractor relationships (value, description, contractor link) |
| **RiskSignal** | Risk indicators per contract (type, severity, resolution status) |
| **MarketShare** | Market share data per contractor/category (win rate, value, period) |

---

## API Endpoints

### Dashboard
- `GET /api/dashboard` — KPIs, charts, recent contracts, risk summary

### Contracts (Full CRUD)
- `GET /api/contracts` — List contracts with pagination, search, and filters
- `POST /api/contracts` — Create a new contract
- `GET /api/contracts/[id]` — Get contract detail with modifications, subcontractors, risk signals
- `PATCH /api/contracts/[id]` — Update a contract
- `DELETE /api/contracts/[id]` — Delete a contract
- `POST /api/contracts/[id]/modifications` — Add a modification to a contract
- `POST /api/contracts/[id]/resolve-signal` — Resolve a risk signal

### Analytics
- `GET /api/patterns` — Pattern detection (persistent winners, Q4 timing, scope creep, award methods)
- `GET /api/relationships` — Network graph data (nodes, edges, risk scores)
- `GET /api/risk-signals` — Risk signals with severity/type filters
- `GET /api/market` — Market intelligence (share, win rates, category stats, positioning)

### Reference Data
- `GET /api/agencies` — List all agencies
- `GET /api/contractors` — List all contractors

---

## How to Use

### Navigation
- Use the **collapsible sidebar** on the left to switch between 6 views
- Press **Ctrl+B** to toggle sidebar between expanded and icon-only modes
- Toggle **dark/light mode** using the button at the bottom of the sidebar

### 1. Dashboard
Overview of the entire contract landscape:
- **KPI Cards**: Total contracts, total value, average value, active risk signals
- **Charts**: Contract value by category, award method distribution, status breakdown
- **Top Contractors**: Bar chart of highest-value contractors
- **Recent Contracts**: Table of latest contract awards

### 2. Contracts Database
Full contract management with search, filter, and CRUD:
- **Search** by contract ID, title, or contractor name
- **Filter** by category, award method, and status
- **Create** new contracts with the + button (requires agency, contractor, category, etc.)
- **View Details** by clicking any row — opens a dialog with full contract info
- **Edit** contracts from the detail dialog
- **Delete** contracts with confirmation
- **Add Modifications** to track value changes and scope creep
- **Resolve Risk Signals** directly from the contract detail view

### 3. Pattern Detection
Identify suspicious or notable patterns in procurement:
- **Persistent Winners**: Contractors with highest win rates by category (expandable accordion charts)
- **Q4 Award Spike**: Detects end-of-year contract award clustering
- **Scope Creep Detection**: Contracts with >30% value growth, with expandable modification history
- **Award Method Distribution**: Pie chart + breakdown of competitive vs. sole-source awards
- **Sole-Source Alert**: Warning when sole-source rate exceeds 20% threshold

### 4. Relationship Mapping
Interactive network visualization:
- **SVG Network Graph**: Circular layout with agencies (inner) and contractors (outer)
- **Hover Highlighting**: Hover a node to highlight its connections, dimming others
- **Click to Select**: Click a node for a detail panel with connections list
- **Risk Coloring**: Contractor nodes are colored by risk score (green→red)
- **Detail Panel**: Shows entity info, risk score, and connected entities
- **Contractor Risk Table**: Sortable table of all contractors ranked by risk score

### 5. Risk Signals
Monitor and filter risk indicators:
- **Severity Cards**: Count of Critical, High, Medium, Low signals
- **Filter Bar**: Filter by severity level and signal type (Sole Source, Scope Creep, Timing Irregularity, Concentration)
- **Distribution Charts**: Bar chart by type, donut chart by severity
- **Signal List**: Scrollable list of risk signals with contract references, severity badges, and resolution status
- **Signal Type Reference**: Explains each risk signal category

### 6. Market Intelligence
Competitive and market analysis:
- **Category Overview**: Cards showing value, contract count, and average per category
- **Market Share by Category**: Tabbed view with bar charts and win rate progress bars per category
- **Total Contract Value by Contractor**: Top 15 contractors, colored by risk score
- **Category Value Distribution**: Donut chart of spending across categories
- **Win Rate Rankings**: Top 20 contractors ranked by win rate with progress bars
- **Competitive Positioning Matrix**: Scatter plot of win rate vs. total value, bubble size = contract count

---

## Key Features

- **Dark Mode** — Toggle between light and dark themes, persisted via next-themes
- **Responsive Design** — Mobile-first with responsive breakpoints (sm/md/lg/xl)
- **Collapsible Sidebar** — Icon-only mode saves screen space
- **Interactive Charts** — Recharts with tooltips, legends, and custom formatters
- **Custom SVG Graph** — Hand-built network visualization with hover/select interactions
- **Full CRUD** — Create, read, update, and delete contracts via REST API
- **Server-Side Analytics** — Pattern detection, risk scoring, and market analysis computed on the backend
- **Toast Notifications** — Feedback for all mutations (create, update, delete, resolve)
- **Loading Skeletons** — Smooth loading states for every view
- **Empty States** — Clear messaging when no data or filters return no results
- **Text Truncation** — Tables use fixed layouts with truncation to prevent horizontal overflow

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database connection string | `file:/home/z/my-project/db/custom.db` |

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `bun run dev` | Start development server on port 3000 |
| `build` | `bun run build` | Create production build |
| `start` | `bun run start` | Start production server |
| `lint` | `bun run lint` | Run ESLint checks |
| `db:push` | `bun run db:push` | Push schema changes to database |
| `db:generate` | `bun run db:generate` | Generate Prisma Client |
| `db:migrate` | `bun run db:migrate` | Run database migrations |
| `db:reset` | `bun run db:reset` | Reset database and re-apply migrations |

---

## Architecture Overview

```
Browser (React)
  ├── Sidebar Navigation (6 views)
  ├── React Query (caching + fetching)
  └── Recharts / Custom SVG (visualizations)
        │
        ▼
Next.js API Routes (REST)
  ├── /api/dashboard    → aggregated KPIs
  ├── /api/contracts    → CRUD + pagination
  ├── /api/patterns     → analytics engine
  ├── /api/relationships → graph builder
  ├── /api/risk-signals → risk queries
  ├── /api/market       → market intelligence
  ├── /api/agencies     → reference data
  └── /api/contractors  → reference data
        │
        ▼
Prisma ORM
  └── SQLite (7 models, relational)
```

The frontend is a single-page app using Next.js App Router. All views are rendered client-side with React Query for data fetching. The API routes handle business logic, aggregation, and database queries via Prisma. Charts are rendered with Recharts using the shadcn/ui ChartContainer wrapper for consistent theming.

---

## License

Private — All rights reserved.
