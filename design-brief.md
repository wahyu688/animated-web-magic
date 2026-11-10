# NexusFlow — Redesign Brief

This document describes the current NexusFlow web app page by page, so a designer (or an AI design tool) can produce a full redesign in Figma. It covers what every screen contains, what data it shows, its states, and the interactions that must survive the redesign. Visual style is open to change; content and functionality are not, unless noted.

---

## 1. Product

**NexusFlow** is a multi-tenant B2B SaaS workspace for small and growing businesses. One workspace replaces scattered tools: tasks (kanban), calendar, team roles, finances, analytics, and an activity feed. Each company's data is isolated (Supabase + PostgreSQL Row Level Security).

- **Audience:** small teams that have outgrown spreadsheets and group chats but don't need heavy enterprise software.
- **Origin:** student startup, BINUS University (Software Engineering course → Venture Creation course, Semester 5). Team mixes Computer Science (product) and Information Systems (business).
- **Live:** https://dashboard-sofeng.online/
- **Stack (for handoff):** React 18 + Vite + TypeScript, Tailwind CSS 3, shadcn/ui (Radix), Framer Motion, Lucide icons, Recharts available, Supabase. The redesign should be implementable with these.

### User flow

```
Landing / Pricing / About (public)
        │
        ▼
     /login  ── sign in ──► has a company? ── yes ──► /dashboard
        │                         │
     sign up                      no
        │                         ▼
  "Check your email"         /pricing (choose plan → simulated payment → workspace created)
                                  │
  Invited user: "N invites" pill in public navbar → Invitation popup → Accept → joins workspace
```

---

## 2. Current visual language (baseline to improve on)

| Token | Light | Dark |
|---|---|---|
| Background | `#F6F7F9` (hsl 228 14% 97%) | hsl 222 47% 8% |
| Card / Surface | `#FFFFFF` | hsl 222 47% 10–12% |
| Foreground | `#0F172A` | hsl 210 40% 98% |
| Primary | `#174ECF` (hsl 222 80% 45%) | `#3C83F6` (hsl 217 91% 60%) |
| Muted text | hsl 215 14% 45% | hsl 215 20% 65% |
| Border | hsl 214 20% 92% | hsl 217 33% 17% |
| Success | hsl 152 69% 31% | — |
| Warning | hsl 38 92% 50% | — |
| Info | hsl 217 91% 60% | — |
| Destructive | hsl 0 84% 60% | hsl 0 63% 31% |

- **Font:** Inter (300–900). Headings are heavy (font-black / tracking-tight).
- **Radius:** base 12px (`--radius: 0.75rem`), cards often 16–24px.
- **Primary gradient:** 135° from `#174ECF` to `#3C83F6` (avatars, logo tile).
- **Shadows:** very soft blue-tinted card shadows; stronger "glow" on primary buttons.
- **Motion:** fade + slide-up 12px on page enter, staggered card entrance, hover lift (-2 to -8px), spring modals, animated SVG chart line drawing.
- **Dark mode tokens exist** but there is no theme toggle in the UI.

### Inconsistencies to fix in the redesign

1. **Two brand blues.** Public pages hard-code `#376CDD` / `#0f2ab3`; the app uses `#174ECF`. Pick one brand primary.
2. **Three logos.** Public navbar uses an `.ico` image + "NEXUSFLOW"; landing footer uses a stacked-shape SVG; app sidebar uses a lightning-bolt (Zap) tile + "Nexus**Flow**". Needs one logo system (mark + wordmark).
3. **Public pages and the app look like two products.** Public pages use raw slate colors, the app uses theme tokens.
4. **Dashboard and Analytics duplicate** the same 4 KPI cards and revenue chart.
5. **Mixed languages** in UI messages (some error/empty states are Indonesian, e.g. "Tidak ada data grafik. Silakan isi di menu Financial."). Redesign copy should be all English.
6. Header "Logout" button is hard-coded white (breaks in dark mode); header search input has no function.
7. Landing footer still says "© 2024"; "Trusted by" row uses placeholder geometric icons, not logos.
8. About page founder photos point to files that don't exist (`tama.png`, `rifat.png`, `bayu.png`, `geary.png`) — design needs an avatar fallback.

---

## 3. Sitemap

**Public**
| Route | Page |
|---|---|
| `/` | Landing |
| `/pricing` (alias `/subscription`) | Pricing + plan checkout |
| `/about` | About |
| `/login` | Sign in / Sign up |

**App (auth + company required, shared app shell)**
| Route | Sidebar label | Icon |
|---|---|---|
| `/dashboard` | Dashboard | Home |
| `/analytics` | Analytics | BarChart3 |
| `/kanban` | Project Board | Kanban |
| `/calendar` | Calendar | Calendar |
| `/team` | Team | Users |
| `/activity` | Activity (unread badge) | Activity |
| `/settings` | Settings | Settings |
| `/financial` | Financial | DollarSign |

Unknown routes redirect to `/`.

---

## 4. Global layouts

### 4.1 Public navbar (Landing, Pricing, About)
- Fixed top, 80px tall, translucent white with blur, hairline bottom border.
- Left: logo + "NEXUSFLOW".
- Center: Home · Pricing · About (active link bold, brand blue).
- Right, logged out: "Login" text link + "Get Started" primary button.
- Right, logged in: "Dashboard" link (only if user has a company) · amber pill "**N invites**" (only if pending invitations; opens Invitation popup) · "Logout".
- Needs a mobile menu (currently links are just hidden below `md`).

### 4.2 App shell (all `/dashboard`… routes)
- **Sidebar** (left, full height, white card, right border)
  - Width 256px expanded / 72px collapsed (chevron toggle at top-right of sidebar header, desktop only).
  - Header 64px: gradient logo tile + "NexusFlow".
  - Nav items: icon + label, rounded-xl; active = primary/10 background + primary text; hover = muted bg, icon scales up.
  - "Activity" shows a pill with unread notification count (realtime).
  - Footer: user card — gradient avatar with initials, green online dot, full name, email.
  - Mobile: off-canvas drawer with dim + blur backdrop, opened by hamburger in the top bar.
- **Top bar** (64px, translucent card with blur, bottom border)
  - Left: hamburger (mobile) · search input "Search anything..." (288px, hidden on xs).
  - Right: "Logout" outline button · bell icon (red pulsing dot when unread; links to Activity) · vertical divider · spinner while reconnecting/refreshing · avatar with initials.
- **Thin progress bar** pinned to the very top of the viewport while the session/company data is refreshing.
- **Content area** scrolls independently; each page fades/slides in on route change.
- **Full-page skeleton** (sidebar + top bar + KPI/chart placeholders) while the company context first loads.
- If the user has no company → redirected to `/pricing`.

### 4.3 Shared states every app page needs
- Loading (spinner overlay or skeletons)
- Error banner: "Failed to load company context. Please refresh or sign in again."
- No-company banner: "Company context is not available. Contact your workspace admin."
- Toasts (bottom/right) for success / error feedback.

---

## 5. Public pages

### 5.1 Landing `/`
1. **Hero** (centered, generous top padding)
   - Announcement pill with pulsing dot: "New: AI Workflow Automation is here"
   - H1: "Scale your operations with intelligent precision." (very large, 48–72px)
   - Sub: "The all-in-one platform for modern teams to automate workflows, analyze performance, and drive measurable growth."
   - CTAs: **Get Started Free** (primary, → /login) · **Learn More** (secondary, scrolls to Features)
2. **Product screenshot** — large dashboard image in a rounded, bordered frame, bottom faded into the page background.
3. **Social proof** — "TRUSTED BY INDUSTRY LEADERS WORLDWIDE" + row of 5 grayscale logos (placeholders today).
4. **Features** — H2 "Engineered for Excellence", sub "Discover the tools designed to propel your business forward with unmatched efficiency and enterprise-grade reliability." 3 cards (icon tile, title, text; lift on hover; icon tile fills blue on hover):
   - Seamless Integration — "Connect your entire tech stack with our one-click native integrations and robust developer-first API."
   - Advanced Analytics — "Gain actionable insights with real-time data visualization, AI-driven summaries, and predictive modeling."
   - Automated Security — "Enterprise-grade protection with automated threat detection, end-to-end encryption, and compliance monitoring."
5. **Footer** — logo + tagline "The modern standard for operational intelligence. Built for teams that value speed, security, and growth." · columns: Product (Features, Pricing, Integrations, Changelog) · Company (About Us, Careers, Blog, Press) · Legal (Privacy Policy, Terms of Service, Cookie Policy) · bottom row: © year NexusFlow Inc. + green status pill "ALL SYSTEMS OPERATIONAL".

*Redesign opportunity:* the landing page is thin. Consider adding sections that show the real modules (Kanban, Calendar, Financial → Dashboard sync, Team roles, Activity feed), a "how it works" strip, and a final CTA band — all backed by features that actually exist.

### 5.2 Pricing `/pricing`
- Public navbar.
- H1 "Simple, transparent pricing" · sub "Choose the plan that works best for your team. All plans include a 14-day free trial."
- **Billing toggle** (segmented): Monthly | Yearly **-20%**
- **3 plan cards** (middle one highlighted: 2px primary border, slightly scaled, "Most Popular" badge):

| Plan | Monthly | Yearly (per month) | Description | Features | CTA |
|---|---|---|---|---|---|
| Starter | $29 | $23 | Ideal for small teams and startups just getting started. | Up to 5 Users · 10GB Cloud Storage · Basic Email Support · Public Projects | Get Started |
| Professional ★ | $99 | $79 | Perfect for scaling companies requiring advanced workflow. | *Everything in Starter, plus:* · Up to 20 Users · 100GB Cloud Storage · Priority Support · Advanced Analytics | Upgrade Now |
| Enterprise | Custom | Custom | For organizations needing enterprise-grade security and scale. | Unlimited Users · Unlimited Storage · Dedicated Account Manager · SSO & Enterprise Security · Custom SLA | Contact Sales |

  Under highlighted CTA: "No credit card required for 14-day trial".
- **FAQ** (3 items): Can I change my plan later? · What payment methods do you accept? · Is there a free trial?
- **Checkout modal** (simulated payment, centered, spring-in), 3 states:
  - Processing — spinner, "Processing payment…", "Activating your **{Plan}** plan. Please wait a moment."
  - Success — animated check, "Payment successful!", "Your **{Plan}** plan is now active.", summary rows (Plan / Billing / Total `$X/month` or Custom), button **Go to Dashboard**.
  - Error — X icon, "Payment failed", error message, **Try Again**.
- Logged-out users clicking a plan go to `/login`. Users who already have a company are sent to `/dashboard`.

### 5.3 About `/about`
- Public navbar.
- H1 "About NexusFlow" · sub "NexusFlow helps small teams run their projects, people, schedules, and finances from one workspace, instead of a pile of spreadsheets and group chats."
- **Two story cards** side by side (large faint icon in background):
  - Our Story (Rocket) — "NexusFlow is a student startup built in the **Venture Creation** course at **BINUS University**. We're taking a working product and turning it into a business: finding out who needs it most, what they'd pay for it, and how to reach them." Tag: "Venture Creation · Semester 5".
  - Two Disciplines, One Team (Users) — "**Computer Science** students build and run the product. **Information Systems** students shape the business side: process analysis, market research, and how NexusFlow fits into the way companies actually work." Chips: Computer Science · Information Systems.
- **Why We're Building This** — 3 pillars: The Problem (warning tone, Puzzle icon) · Our Solution (primary tone, Layers) · Who It's For (success tone, Target).
- **Meet The Founders** — 5 cards: photo, name, role, "NIM: …" chip, hover lift.
  - Wahyu A. Barmawi — CTO — 2802497800
  - Valerian Hutama — COO — 2802493033
  - Rif'at Rifqi — CMO — 2802497435
  - Bayu Arroyyan — CEO — 2802498091
  - Samuel Geary Lowfrint — CFO — 2802496634
- Footer note: "Built with ♥ by the NexusFlow Team".

### 5.4 Login `/login`
Split screen (left half hidden on mobile).
- **Left — brand panel:** looping background video (`/videos/LoginPage.mp4`) with dark + gradient overlays; logo top-left; bottom: H2 "Scale your operations with intelligent precision.", paragraph "NexusFlow transforms how engineering and product teams collaborate with realtime analytics, intelligent workflows, and seamless productivity tools.", stacked avatar circles + "Joined by 10,000+ teams".
- **Right — form panel:** "← Back" link top-left; centered form ~400px wide.
  - Sign in mode: H1 "Welcome back" · "Enter your details to access your dashboard." · Email (mail icon, "name@company.com") · Password (lock icon, "Forgot password?" link) · **Sign In →** · divider "Or continue with" · Google / GitHub buttons · "Don't have an account? **Sign up**".
  - Sign up mode: H1 "Create an account" · "Start your 14-day free trial. No credit card required." · First Name / Last Name (animate in, 2 columns) · Email · Password (min 6) · **Create Account →** · "Already have an account? **Sign in**".
  - Email-confirmation state: check icon, "Check your email", "We've sent a confirmation link to **{email}**. Please verify your account to continue.", **Back to Sign In**.
  - Loading state on submit button (spinner).
- **Floating alert** top-right (slides in, auto-dismiss 4s, close X): success (green) / error (red). Google/GitHub currently show "… login is not configured yet."

---

## 6. App pages

### 6.1 Dashboard `/dashboard`
- Header: H1 "Dashboard" · "Welcome back, **{email}**. Monitor your key metrics." · **Export** button (ArrowUpRight).
- **4 KPI cards** (icon, label, big value, trend pill up/down/flat + "vs prev. period"; skeleton while loading):
  - Total Revenue (DollarSign, primary) · Active Users (Users, info) · Avg. Session (Clock, warning) · Churn Rate (BarChart3, muted)
- **Row: Revenue chart (2/3) + Traffic Sources (1/3)**
  - *Revenue Growth* — "Income trends across all channels." Legend: Current (solid blue line + gradient area) / Previous (dashed gray line). Hover a point → dark tooltip with `$value`. Month labels on x-axis. Empty state: "No chart data yet. Add it in Financial."
  - *Traffic Sources* — list of source name + percent with animated horizontal progress bars.
- **Top Performing Pages** — table: Page | Views. Empty: "No page analytics data available."

### 6.2 Analytics `/analytics`
- Header: H1 "Analytics Overview" · "Monitor your key performance metrics and business growth." · range segmented control **7D / 30D / 3M / 1Y** · **Export Report** (Download icon; toast "Exporting Report").
- Same 4 KPI cards as Dashboard.
- Full-width large **Revenue Growth (Live)** chart — "Income trends dynamically generated from Database." Legend Current Year / Previous Year; hover shows vertical dashed guide + tooltip with month label and value.
- *Redesign note:* differentiate from Dashboard (e.g. add breakdowns: revenue by type, expenses, profit margin, customer growth/churn over time — all of this data exists from the Financial form).

### 6.3 Project Board `/kanban`
- Header: H1 "Project Board" · "Track and manage your project tasks visually." · **+ New Task** (adds to To Do).
- **5 columns**, horizontally scrollable, drag-and-drop between and within columns:
  | Column | Dot color |
  |---|---|
  | Backlog | muted gray |
  | To Do | warning |
  | In Progress | primary |
  | Review | warning |
  | Done | success |
  Column header: color dot, title, task count chip, "⋯" menu. Bottom of column: dashed "+ Add Task".
- **Task card:** tag chip · "High" priority badge (when high) · delete (trash, appears on hover) · title · footer: assignee initial avatar, comment count, attachment count, due date (clock).
  - Dragging state: rotated 2°, scaled 105%, strong shadow, primary ring.
- **Task slide-over** (right panel, opens on card click):
  - Tag chip, inline-editable title (saves on blur), close X.
  - Assignee select ("Unassigned" + company members).
  - Description — read view or textarea with Edit/Save. Empty: "No description provided. Click edit to add one."
  - Subtasks — "{done}/{total} completed", progress bar, checklist (circle / check), "Add new subtask..." input.
  - Activity — list of comments/events (avatar initial, name, text, date); empty "No activities yet."; comment input "Write a comment..." + send.
- Delete confirmation modal (shared component).

### 6.4 Calendar `/calendar`
Two-pane layout.
- **Left sidebar:** **+ Create Event** button · mini month calendar (month/year, prev/next, weekday header, day grid; selected day = filled primary circle; click selects, double-click creates event) · "Upcoming Events" list (color bar, title, "Mon, 12 • 🕒 09:00").
- **Main:** title changes by view ("November 2026" / "Monday, November 10, 2026" / "Week of November 9 - 15") · segmented **Day / Week / Month** with sliding active indicator.
  - Week/Day view: hour rows from 08:00, 60px per hour; events are colored blocks positioned by time with height = duration; double-click empty slot to create.
  - Month view: 7-col grid, day number, up to 2 event chips ("09:00 Title"), "+N more".
- **Event detail modal:** color bar, title, close · time row (day, time, duration in hr) · description ("No specific details provided.") · calendar "My Calendar" · **Delete** (destructive) · **Edit Event** · **Close**.
- **Create/Edit event modal:** Event Title ("e.g., Marketing Sync") · Date · Time (select) · Duration (Hours, 0.5–5, step 0.5) · Color (Blue/Primary, Cyan/Info, Green/Success, Yellow/Warning, Red/Urgent, Purple) · Cancel / **+ Create** or **Save Changes**.

### 6.5 Team `/team`
- Header: H1 "Team Management" · "Manage your team access, roles, and permissions." · **Export** · **Invite Colleague** (Mail icon, primary).
- **Members table card:**
  - Toolbar: search "Search by name, email, or role..." · Role filter (All Roles / Admin / Editor / Viewer) · Status filter (Status: All / Active / Pending).
  - Columns: checkbox (select all) · User (initials avatar, name, email) · Role (icon + label badge) · Status (dot + Active/Pending) · Date Joined · Actions (Edit, Delete).
  - Empty: "No members found" / "Try adjusting your search or filters."
  - Footer: "Showing X of Y members" · "N selected" · pagination (Previous, page numbers, Next).
- **Pending Invitations card:** "Manage pending invites sent to your workspace." Rows: email, "Pending · {date}", **Resend**, **Cancel**. Empty: "No pending invitations."
- **Invite / Edit modal:** Mail icon + title ("Invite Colleague" / "Edit Member Access") · helper text "Send an invitation. When they sign up with this email, they will automatically join your company workspace." · Email Address ("colleague@company.com", locked when editing) · Assign Role (Admin / Editor / Viewer) · Cancel / **Send Invite** or **Save Changes** (spinner while saving).
- **Delete confirm modal:** "Remove Member?" — "This user will lose access to all projects immediately." / "Cancel Invitation?" — "This email will no longer be able to join your workspace."

### 6.6 Activity `/activity`
- Header: H1 "Activity Feed" · "Updates across your projects and teams" · **Filter** · **✓ Mark all read**.
- Underline tabs: **All Activity · Mentions (unread count badge) · System**.
- Feed card with section label ("Recent" / tab name). Each item:
  - Unread indicator dot · avatar (initials) or colored icon tile (system events) · sentence "**{user}** {action} **{target}**" · relative time.
  - Optional quoted message, threaded replies ("You · time" + text).
  - Mention items: **Reply** (inline input "Type your reply..." + send) · **View Ticket** (opens ticket slide-over).
  - Some items: **Join Project** button.
  - Items reorder/exit with spring layout animation.
- Empty: "No activities found for this category."
- **Load older activity** button (spinner while loading).
- Realtime: new notifications increment the sidebar badge and bell dot.

### 6.7 Settings `/settings`
- Header: H1 "Settings" · "Manage your account settings and preferences."
- Left vertical tab list (horizontal scroll on mobile), content panel on the right with fade transition between tabs:
  1. **General** (User) — Profile Photo (avatar, "Accepts JPG, GIF or PNG. 1MB Max.", **Upload New**) · First Name · Last Name · Email Address (read-only, "Email is managed by authentication provider.") · Bio ("Tell us a little about yourself...") · Timezone · Save.
  2. **Security** (Lock) — Change Password: New Password, Confirm Password, Update · "Account Protection — Your account is secured by Supabase Authentication layer."
  3. **Notifications** (Bell) — Email Notifications toggles: Mentions & Replies ("When someone mentions you") · Project Updates ("Status changes and milestone completions") · Weekly Digest ("A summary of your activity every Monday").
  4. **Billing** (CreditCard) — "Billing & Subscription": Current Plan · Billing Cycle · Expires At · **Upgrade Plan** · **Manage Subscription**. Empty: "No active subscription — Your company does not currently have an active subscription."
  5. **Integrations** (Puzzle) — "Connected Apps": Slack (connected → Disconnect), GitHub (→ Connect).
  6. **Workspace** (Monitor) — "Workspace Settings / Manage your workspace name and visibility." Workspace Name · **Save Workspace**. Non-owners see "Only company owners can edit workspace details." (disabled).
  7. **Team** (Users) — "Team Settings / Manage team members and roles." Member list with role select (Owner / Admin / Member). Empty: "No active team members found."

### 6.8 Financial `/financial`
The data-entry source that feeds the Dashboard and Analytics charts/KPIs.
- Header: H1 "Financial Input" · "Enter your raw monthly operational data. The system will auto-calculate KPIs."
- **Left: "Monthly Report Entry" form card** (Calculator icon)
  - Reporting Month (Jan–Dec select)
  - **Revenue:** Subscription Revenue (e.g. 120000) · Enterprise Revenue (45000) · One-Time Revenue (12000) · Refunds / Discounts (3000)
  - **Customers:** New Customers (120) · Lost Customers (12) · Active Customers (1450) · Trial Users (250)
  - **Expenses:** Payroll Expenses (45000) · Marketing Spend (12000) · Infrastructure Cost (8000) · Software Licenses (3000) · Operational Expenses (5000, full width)
  - **Operations:** Monthly Active Users (25000) · Support Tickets (32) · Avg. Session Duration (Minutes) (6.5, hint "Example: 6.5 = 6m 30s")
  - **Live "Calculated Summary — {Month}" panel:** Total Revenue · Total Expenses · Net Profit (green/red) · Profit Margin % · Churn Rate % · Net Customers (+/−) · Growth vs previous month ("— (no earlier month recorded)" or "+X% (prev $Y)")
  - Submit: **Process & Sync to Dashboard** (Save icon, spinner while processing)
- **Right: "Annual Ledger" card** (Receipt icon) — badge "Synced with Chart" when data exists. Table: Month · Actual Revenue · Target / Prev · Status (green "Hit" with trend icon / red "Miss"). Empty: "No financial data recorded yet. Submit a monthly report to start tracking."

---

## 7. Shared overlays & components

| Component | Where | Notes |
|---|---|---|
| Invitation popup | Public navbar "N invites" pill | States: loading "Checking your invitation…" · invite ("WORKSPACE INVITATION", "You've been invited", "Accept this invitation to join your team's shared workspace and collaboration dashboard.", **Accept Invite** / **Decline**, inline error) · none ("No pending invitations"). |
| Delete confirm modal | Kanban, Team | Title, item name, description, Cancel / destructive confirm. |
| Task slide-over | Kanban | See 6.3. |
| Ticket slide-over | Activity | Opened by "View Ticket". |
| Toast | Everywhere in app | Title + description; destructive variant. |
| Floating alert | Login | Top-right, auto-dismiss. |
| Dashboard skeleton | App shell first load | Mirrors sidebar + header + KPI + chart layout. |

Base UI primitives available (shadcn/ui): button, input, textarea, select, checkbox, switch, tabs, dialog, sheet, drawer, dropdown, popover, tooltip, table, badge, avatar, card, progress, skeleton, calendar, chart, toast/sonner, pagination, scroll-area, accordion.

---

## 8. Responsive behavior

- Breakpoints: Tailwind defaults (sm 640, md 768, lg 1024, xl 1280, 2xl container 1400).
- App sidebar becomes an off-canvas drawer below `md`; collapse toggle only on desktop.
- Login brand panel hidden on mobile.
- Kanban scrolls horizontally on all sizes.
- Settings tabs become a horizontal scroll row on mobile.
- Tables (Team, Top Pages, Ledger) need a mobile treatment (cards or horizontal scroll).
- Public navbar needs a proper mobile menu (missing today).

---

## 9. What the redesign should deliver

1. **One design system**: brand color, logo (mark + wordmark), type scale, spacing, radius, elevation, light **and** dark themes, plus a visible theme toggle in the app top bar.
2. **Public site** that feels like the same product as the app: Landing (expanded with real module showcases), Pricing (incl. checkout modal states), About, Login/Sign-up (all states).
3. **App shell**: sidebar expanded/collapsed/mobile, top bar, loading bar, skeleton.
4. **All 8 app pages** with loading, empty, and error states, and every modal/slide-over listed above.
5. **Component sheet**: buttons (primary/secondary/ghost/destructive, sizes, loading), inputs, selects, toggles, tabs/segmented controls, badges (role, status, priority, trend), KPI card, chart card, table, task card, event chip, feed item, modal, slide-over, toast.
6. Keep motion subtle and purposeful (page enter, card hover, drag feedback, modal spring); respect reduced-motion.
7. Accessibility: text contrast ≥ 4.5:1, visible focus rings, 44px touch targets on mobile.

**Must not change:** routes, the feature set, the data fields on the Financial form, the 5 Kanban columns, role names (Team: Admin/Editor/Viewer; Settings: Owner/Admin/Member), plan names and prices.
