# THOTH ERP — Complete Documentation

## Table of Contents

1. [What is THOTH](#1-what-is-thoth)
2. [Getting Started](#2-getting-started)
3. [Module Reference](#3-module-reference)
4. [AI Assistant (ThothAI)](#4-ai-assistant-thothai)
5. [Pricing Plans](#5-pricing-plans)
6. [Integrations](#6-integrations)
7. [Administration](#7-administration)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What is THOTH

THOTH is a bilingual (Arabic/English) business operating system built in Egypt for furniture manufacturers and SMBs across MENA. Named after the ancient Egyptian god of writing, accounting, and record-keeping.

### Core Philosophy
- **Writing** → Every interaction becomes a record automatically
- **Counting** → Stock, assets, payments, points reconcile themselves
- **Judgement** → Dashboards surface insights before they cost you money

### 34 Modules
| Category | Modules |
|----------|---------|
| Sales | Quotations, Sales Orders, Pipeline, Products & BOM |
| Production | Production Planning, Cutting Lists, 7-Stage Manufacturing |
| Inventory | Stock Management, ABC Analysis, Asset Depreciation |
| Finance | Invoices, Payments, Expenses, Cost Analysis, Profit Reports |
| CRM | Organizations, People, Activity Feed, 360° Views |
| E-commerce | Shopify Two-Way Sync, Loyalty Program |
| Operations | Quality Control, Delivery & Installation |
| HR | Employee Directory, Skills Matrix, Attendance, Leave |
| Intelligence | Sky Eye Dashboard, Health Scoring, Risk Radar, Forecasting |
| Design | Design Briefs, Technical Drawings, Approval Workflows |
| Advanced | Document Generator, Multi-Branch, Workshop Board |

---

## 2. Getting Started

### Quick Start (Demo Mode)
```bash
pnpm install
pnpm dev
# Open http://localhost:5173
```
Demo mode includes sample data for all 34 modules. No login required.

### Production Setup
1. Create a Supabase project at https://supabase.com
2. Run SQL migrations in order:
   - `supabase/schema.sql`
   - `supabase/connected-furniture-engine.sql`
   - `supabase/connected-customer-workflow.sql`
   - `supabase/users-access-control.sql`
3. Create `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Configure auth redirect URLs in Supabase Dashboard
5. Deploy to Vercel/Netlify

### AI Assistant Setup
1. Add OpenAI API key to Supabase Edge Functions:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```
2. Deploy the edge function:
   ```bash
   supabase functions deploy ai-chat
   ```
3. The AI assistant (ThothAI) will appear as a floating button in the bottom-right corner

---

## 3. Module Reference

### 3.1 Sales

#### Quotations (عروض الأسعار)
- Create quotations with line items, dimensions, materials, and pricing
- Auto-calculated totals with tax support
- Version history for every quotation
- Convert to Sales Order with one click
- PDF export
- CSV import/export

**How to create a quotation:**
1. Navigate to Quotations from the sidebar
2. Click "New Quotation"
3. Select customer from Organizations
4. Add line items (product, dimensions, material, quantity, unit price)
5. Review totals and save
6. Send to customer or convert to Sales Order

#### Sales Orders (طلبات العملاء)
- Full lifecycle: Draft → Confirmed → In Production → Delivered → Done
- Payment tracking per order
- Production readiness checklist (5-point)
- Linked to quotations, measurements, designs, and production

#### Products & BOM (المنتجات)
- Product catalog with categories
- Bill of Materials (BOM) per product
- Manufacturing stages configuration
- Pricing with cost and margin calculations
- CSV import/export

#### Pipeline (المبيعات)
- 6-stage visual pipeline board
- Deal value and probability tracking
- Drag-and-drop stage progression
- Deal story page with full history

### 3.2 Production

#### Production Planning (تخطيط الإنتاج)
- Production orders from approved designs
- Cutting lists with parts, materials, edges, grain direction, CNC data
- 7-stage manufacturing tracking:
  1. **Cutting** (القص)
  2. **Edge Banding** (الشريط الحدي)
  3. **Drilling** (الثقب)
  4. **Assembly** (التجميع)
  5. **Finishing** (التشطيب)
  6. **Quality Check** (فحص الجودة)
  7. **Packing** (التعبئة)
- Start/done controls per stage
- Time tracking (auto-calculated)
- Station & workshop assignment
- Priority levels (Critical → Low)
- Progress bar (auto-calculated from stages)

#### Workshop Board (لوحة الورشة)
- Visual board showing all production orders
- 7-column layout matching production stages
- Drag-and-drop between stages
- Real-time status overview

### 3.3 Inventory

#### Stock Management (المخزن)
- SKU-based tracking
- Reorder level alerts
- Stock movements history
- Multi-location support

#### ABC Analysis
- **A items**: High-value, low-quantity (tightest control)
- **B items**: Medium value and quantity
- **C items**: Low-value, high-quantity (simplest control)
- Auto-categorization based on consumption value

#### Asset Depreciation
- Straight-line depreciation tracking
- Monthly depreciation calculations
- Asset lifecycle management

### 3.4 Finance

#### Invoices (الفواتERS)
- Create from Sales Orders
- Payment tracking (partial, full, overdue)
- Status workflow: Draft → Sent → Paid/Overdue
- PDF generation

#### Payments & Expenses
- Record payments against invoices
- Expense categories
- Cash flow tracking

#### Cost Analysis
- 6 cost types per order
- Per-order breakdown
- Margin analysis

#### Profit Reports
- Revenue vs cost per order
- Margin analysis by product/customer/period
- Trend visualization

### 3.5 CRM

#### Organizations (العملاء)
- Company profiles with contacts
- 360° view with 9 tabs (Overview, Sales, Work, Activity, Files, Notes, Intelligence)
- Relationship scoring
- Lifecycle tracking
- CSV import/export

#### People (جهات الاتصال)
- Contact management
- Card/Table views
- Relationship mapping
- Activity history

#### Activity Feed (النشاط)
- 24 event types tracked automatically
- Timeline view
- Filterable by module and type

### 3.6 E-commerce

#### Shopify Integration
- **Two-way sync** for products, orders, customers, stock levels
- Per-data-type control: import, export, two-way, or off
- SKU-based inventory matching
- Nightly stock level push
- 5-minute setup, no developer needed

#### Loyalty Program (الولاء)
- Points earning and redemption
- Tier system: Silver → Gold → Platinum
- Campaign management
- Customer-facing points display
- Shopify profile integration

### 3.7 Quality Control

#### QC Inspections (مراقبة الجودة)
- 5 inspection types
- 10-point bilingual checklist (Pass/Fail per item)
- Auto-calculated overall score (percentage)
- Defect logging with severity, category, photos
- Rework workflow: Open → Rework → Re-inspect → Accept/Reject
- Linked to Production Orders and Sales Orders

### 3.8 Delivery & Installation

#### Delivery Scheduling (التسليم والتركيب)
- Date, time slot, driver, vehicle assignment
- Dispatch tracking: Scheduled → Loading → Transit → Delivered
- Installation team assignment (leader + members)
- 10-point bilingual installation checklist
- Snag/punch list with severity and resolve tracking
- Photo uploads
- Customer rating (1-5 stars)

### 3.9 HR & Workforce

#### Employee Directory (الموارد البشرية)
- 9 departments, bilingual profiles
- Skills matrix: 12 skills × 5 proficiency levels
- Attendance tracking (daily check-in/out, 8 status types)
- Leave requests: 6 types with approval workflow
- Employment types: full-time, part-time, contract, daily

### 3.10 Intelligence

#### Sky Eye Dashboard (عين السماء)
- Daily greeting and health ring
- 6 key metrics: Pipeline, Revenue, In Progress, Completion, Overdue, Health
- Revenue & cash flow cards with mini charts
- Orders & production status
- Intelligence feed (color-coded alerts/wins/opportunities/risks)
- Today's priorities with score bars
- Health indicators (Sales/Work/Finance/Assets)
- Overdue alerts
- Inventory alerts
- Top risks and opportunities
- Quick navigation
- Today's schedule
- **Detail drawers**: Click any item to open a slide-out panel with details

#### Health Scoring
- Weighted score from 4 sub-scores: Sales, Work, Finance, Resources
- Real-time updates based on data

#### Risk Radar (تنبيهات مهمة)
- Automatic risk detection
- Severity scoring (0-100)
- Mitigation suggestions
- Filterable by type

#### Forecast Engine (التوقعات)
- Work velocity predictions with confidence scores
- Dependency analysis
- Trend visualization

#### Decision Center (القرارات)
- 11-tab intelligence hub
- Pattern detection
- Goal drift detection
- Relationship intelligence
- Friction detection
- Weekly intelligence reports

### 3.11 Design

#### Design Briefs (التصميمات)
- Auto-generated from approved measurements
- Technical drawing uploads (Images/PDF/DXF/DWG)
- 7-stage approval workflow with client sign-off
- Version history per design
- Comments & annotations with roles

### 3.12 Advanced Features

#### Document Generator
- Print-ready invoices and statements
- Custom templates

#### Multi-Branch
- Factory/Showroom/Warehouse/Office locations
- Branch-level reporting

---

## 4. AI Assistant (ThothAI)

### Overview
ThothAI is an AI-powered assistant that helps you navigate THOTH, answer questions about features, analyze business data, and provide recommendations.

### How to Use
1. Click the **Sparkles icon** (floating button, bottom-right)
2. Type your question or request
3. ThothAI responds with structured, actionable information

### What ThothAI Can Do
- Answer questions about any THOTH module
- Explain workflows (e.g., "How do I create a quotation?")
- Analyze business metrics when context is provided
- Recommend actions based on business health
- Help with pricing and plan selection
- Troubleshoot issues
- Provide bilingual support (Arabic/English)

### Suggested Questions
- "How do I create a quotation?"
- "What are the pricing plans?"
- "How does ABC analysis work?"
- "Tell me about Shopify sync"
- "How do I track production?"
- "What's the difference between Scribe and Temple plans?"

### Setup Requirements
- Supabase project with Edge Functions enabled
- OpenAI API key (configured as Supabase secret)
- The AI uses GPT-4o-mini for fast, cost-effective responses

### Architecture
- **Frontend**: `src/components/AIAssistant.tsx` — Sleek chat panel with streaming responses
- **Backend**: `supabase/functions/ai-chat/index.ts` — Edge function proxying OpenAI API
- **System Prompt**: Comprehensive THOTH knowledge base with 34 modules, pricing, workflows
- **Fallback**: Local knowledge base for common questions (works without API key)

---

## 5. Pricing Plans

### Apprentice (المتبرع)
- **Price**: Free forever
- **Users**: 1
- **Includes**: Contacts, products, quotations, Arabic & English, community help
- **Best for**: Solo entrepreneurs starting out

### Scribe (الكاتب)
- **Price**: 900 EGP/mo base + 299 EGP/user/mo
- **Includes**: Everything in Apprentice + Sales orders, invoicing, inventory, assets, ABC analysis, production planning, cutting lists, reports, dashboards, email support
- **Best for**: Teams that make and sell

### Temple (المعبد)
- **Price**: 4,999 EGP/mo base + 499 EGP/user/mo
- **Includes**: Everything in Scribe + Two-way Shopify sync, loyalty program, campaigns, HR, quality, delivery modules, priority support (same-day), one custom-build day per month
- **Best for**: The whole house of records

### Dynasty (السلالة)
- **Price**: Custom
- **Includes**: Unlimited users & branches, dedicated success engineer, anything custom built in 1 day, on-premise option
- **Best for**: Groups, franchises & ambitions

### Interactive Pricing Calculator
The landing page includes a smart pricing calculator:
1. Slide to your team size (1-40 people)
2. Toggle monthly/yearly billing (yearly = 2 months free)
3. Select your needs (Production, Shopify, Custom)
4. The recommended plan highlights automatically
5. See honest total with per-person breakdown

---

## 6. Integrations

### Shopify
- **Setup**: Connect in 5 minutes, no developer needed
- **Sync types**: Products, Orders, Customers, Stock Levels
- **Direction**: One-way (import/export) or Two-way per data type
- **Frequency**: Real-time for orders, nightly for stock levels

### Supabase
- **Auth**: Email/password + Google OAuth
- **Database**: PostgreSQL with Row Level Security
- **Storage**: File uploads (photos, documents, technical drawings)
- **Edge Functions**: AI chatbot, Shopify webhooks

---

## 7. Administration

### User Management
- Workspace-based multi-tenancy
- Role-based access control
- Invitation system
- Member management

### Settings
- Company profile
- Module enable/disable
- Currency configuration
- Language preference (Arabic/English)

### Data Management
- CSV import/export for all major entities
- Template downloads for imports
- Bulk operations

---

## 8. Troubleshooting

### Common Issues

**"Go Live" in VS Code doesn't work**
THOTH requires the Vite dev server. Always use `pnpm dev`, not VS Code's "Go Live" extension.

**No data showing (Production mode)**
Run Supabase migrations and configure `.env.local` with your Supabase credentials.

**AI Assistant not responding**
Ensure `OPENAI_API_KEY` is set in Supabase Edge Functions secrets and the `ai-chat` function is deployed.

**Dark mode not working**
Ensure `next-themes` ThemeProvider is wrapping the app (it is by default in App.tsx).

**TypeScript errors**
Run `pnpm typecheck` to identify issues. Pre-existing errors in other files don't affect new code.

### Getting Help
- **Email**: hello@thoth.app
- **Documentation**: This file
- **AI Assistant**: Click the Sparkles icon in the app

---

## Appendix: Complete Lifecycle Flow

```
Customer → Quotation → Sales Order → Site Visit → Measurements
    │                                              │
    │                                      Design Brief
    │                                              │
    │                                      Production Order
    │                                              │
    │                          ┌───────────────────┼───────────────────┐
    │                          ▼                   ▼                   ▼
    │                      Cutting             Edgebanding          Assembly
    │                          │                   │                   │
    │                          └───────────────────┼───────────────────┘
    │                                              ▼
    │                                          Finishing
    │                                              │
    │                                              ▼
    │                                        Quality Check
    │                                              │
    │                                              ▼
    │                                          Delivery
    │                                              │
    │                                              ▼
    │                                        Installation
    │                                              │
    └──────────────────────────────────────────────┘
                                          Customer Sign-off
```

---

*THOTH ERP Documentation v1.0 — Built in Cairo, Egypt*
*© 2026 THOTH. All rights reserved.*
