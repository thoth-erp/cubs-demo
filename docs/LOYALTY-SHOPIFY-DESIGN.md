# THOTH Loyalty Program + Shopify Integration — System Design

**Module:** Optional · Retail/Fashion/Furniture vertical  
**Status:** Design phase — not yet implemented  
**Date:** 2026-06-10

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Shopify Integration — How It Works](#2-shopify-integration)
3. [Online Redemption Flow](#3-online-redemption)
4. [Offline Redemption Flow](#4-offline-redemption)
5. [Shopify Limitations & Constraints](#5-shopify-limitations)
6. [Shopify API/App Setup Requirements](#6-shopify-setup)
7. [MVP vs Later](#7-mvp-vs-later)
8. [Data Model](#8-data-model)
9. [Security Design](#9-security)
10. [Store Staff UX Journey](#10-staff-journey)
11. [Screen Inventory](#11-screens)
12. [Points Rule Engine](#12-rule-engine)
13. [Customer Matching Logic](#13-customer-matching)
14. [Tier System](#14-tier-system)
15. [Implementation Plan](#15-implementation-plan)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        THOTH Frontend                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Loyalty   │ │ Staff    │ │ Admin    │ │ Customer 360 │  │
│  │ Dashboard │ │ Lookup   │ │ Settings │ │ + Loyalty Tab│  │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └──────┬───────┘  │
│        │             │            │              │           │
│        └─────────────┼────────────┼──────────────┘           │
│                      │            │                          │
│              getDataSource() + Supabase RLS                  │
└──────────────────────┼────────────┼──────────────────────────┘
                       │            │
┌──────────────────────┴────────────┴──────────────────────────┐
│                     Supabase Backend                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Tables: loyalty_programs, loyalty_rules, loyalty_members, ││
│  │ loyalty_transactions, loyalty_tiers, loyalty_rewards,     ││
│  │ loyalty_redemptions, shopify_connections, shopify_orders,  ││
│  │ shopify_sync_log                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────────────────┐  ┌────────────────────────────────┐│
│  │ Edge Functions        │  │ Database Functions (RPC)       ││
│  │                       │  │                                ││
│  │ • shopify-webhook     │  │ • calculate_points(order)      ││
│  │ • shopify-sync        │  │ • redeem_points(member, amt)   ││
│  │ • loyalty-redeem      │  │ • match_customer(identifiers)  ││
│  │ • generate-discount   │  │ • recalculate_tier(member)     ││
│  └───────────┬───────────┘  │ • reverse_points(order)        ││
│              │               └────────────────────────────────┘│
└──────────────┼────────────────────────────────────────────────┘
               │
               │  HTTPS webhooks + Admin API
               │
┌──────────────┴───────────────┐
│      Shopify Store           │
│                              │
│  Webhooks:                   │
│  • orders/create             │
│  • orders/paid               │
│  • orders/cancelled          │
│  • refunds/create            │
│  • customers/create          │
│  • customers/update          │
│                              │
│  Metafields:                 │
│  • customer.loyalty_points   │
│  • customer.loyalty_tier     │
│  • customer.loyalty_id       │
│                              │
│  Discount Codes:             │
│  • Auto-generated for        │
│    loyalty redemptions       │
└──────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Webhook handler | Supabase Edge Function | Runs server-side, can validate HMAC, no service key in frontend |
| Points calculation | Database function (RPC) | Atomic, consistent, avoids race conditions |
| Shopify API calls | Edge Functions only | Shopify credentials never touch frontend |
| Customer matching | DB function | Complex logic with fallback chain, needs transactions |
| Redemption | Edge Function → Shopify API | Needs to create discount codes server-side |
| Points balance | Computed from transactions | Single source of truth, no balance drift |

### How It Fits Into THOTH

- **New sidebar section:** "Loyalty" under Core, with sub-pages
- **Customer360 extension:** New "Loyalty" tab on existing Customer360 page
- **People profile extension:** Loyalty summary card on People 360° page
- **Data source pattern:** Uses same `getDataSource()` + `EntityAdapter` pattern
- **Multi-tenant:** All tables have `workspace_id`, all queries use RLS
- **Bilingual:** Full EN/AR support, same as all THOTH modules

---

## 2. Shopify Integration

### Connection Setup

1. Admin navigates to **Loyalty → Shopify Connection**
2. Enters Shopify store URL (e.g., `my-store.myshopify.com`)
3. THOTH creates a Shopify Custom App or uses Shopify Admin API access token
4. Admin enters the access token (one-time, stored encrypted in `shopify_connections`)
5. THOTH Edge Function registers webhooks on the Shopify store
6. Connection verified with a test API call

### Sync Flow: Shopify → THOTH

```
Shopify Event (order/paid)
    │
    ▼
Shopify sends POST to Edge Function URL
    │
    ▼
Edge Function: shopify-webhook
    ├── Validate HMAC signature
    ├── Parse order payload
    ├── Log raw event to shopify_sync_log
    ├── Match customer (see §13)
    ├── Call calculate_points() RPC
    ├── Insert loyalty_transaction
    ├── Recalculate tier if needed
    └── Return 200 OK to Shopify
```

### Sync Flow: THOTH → Shopify

```
Points balance changes (earn/redeem/adjust)
    │
    ▼
DB trigger or Edge Function
    ├── Update Shopify customer metafields:
    │   ├── namespace: "thoth_loyalty"
    │   ├── key: "points_balance"
    │   ├── key: "tier"
    │   └── key: "member_id"
    └── If redemption:
        └── Create Shopify Price Rule + Discount Code
```

### What Data Syncs

| Direction | Data | Trigger |
|-----------|------|---------|
| Shopify → THOTH | New customer | `customers/create` webhook |
| Shopify → THOTH | Customer update | `customers/update` webhook |
| Shopify → THOTH | Order details + line items | `orders/paid` webhook |
| Shopify → THOTH | Cancellation | `orders/cancelled` webhook |
| Shopify → THOTH | Refund details | `refunds/create` webhook |
| THOTH → Shopify | Points balance | After any transaction |
| THOTH → Shopify | Tier level | After tier change |
| THOTH → Shopify | Discount code | On loyalty redemption |

---

## 3. Online Redemption

### Flow

```
Customer in Shopify checkout
    │
    ▼
Sees current points balance (via Shopify metafield or theme extension)
    │
    ▼
Clicks "Redeem X points for Y EGP discount"
    │
    ▼
THOTH Edge Function: loyalty-redeem
    ├── Verify customer has enough points
    ├── Verify redemption meets rules (min points, max discount, etc.)
    ├── Deduct points (insert loyalty_transaction type=redeemed)
    ├── Create Shopify Price Rule (fixed amount, single use)
    ├── Create Shopify Discount Code linked to that rule
    ├── Insert loyalty_redemption record
    └── Return discount code to customer/theme
    │
    ▼
Customer applies discount code at checkout
    │
    ▼
Order completes → standard order webhook → NEW points earned on remaining amount
```

### Implementation Options (ranked)

1. **Shopify Theme App Extension** (recommended for MVP)
   - Widget on cart/checkout showing points + redeem button
   - Calls THOTH Edge Function via fetch
   - Returns discount code that auto-applies

2. **Shopify Functions (Checkout Extensions)**
   - Deeper integration, runs inside Shopify checkout
   - More complex to build, requires Shopify App review
   - Better UX — discount applies automatically

3. **Manual code entry**
   - Customer requests code via account page or WhatsApp
   - Simplest but worst UX

---

## 4. Offline Redemption

### Flow

```
Customer in physical store
    │
    ▼
Staff opens THOTH → Loyalty → Staff Lookup
    │
    ▼
Searches by phone: 01012345678
    │
    ▼
Sees customer card:
┌──────────────────────────────────────┐
│  Ahmed Mohamed                  Gold │
│  01012345678                         │
│  ─────────────────────────────────── │
│  Points: 12,450                      │
│  Available: 10,000 (2,450 locked)    │
│  ─────────────────────────────────── │
│  [🎁 Redeem]  [➕ Add Purchase]      │
└──────────────────────────────────────┘
    │
    ▼
Staff taps "Redeem"
    ├── Enters redemption amount (e.g., 5,000 points = 50 EGP)
    ├── Confirms with customer
    ├── THOTH creates loyalty_transaction (type=redeemed, source=store)
    ├── Creates loyalty_redemption (channel=offline, staff_id=...)
    ├── Updates Shopify metafield
    └── Prints/shows confirmation

Staff taps "Add Purchase"
    ├── Enters purchase amount (e.g., 500 EGP)
    ├── Optionally enters receipt number
    ├── THOTH calculates points (500 EGP → 5,000 pts)
    ├── Creates loyalty_transaction (type=earned, source=store)
    ├── Updates balance + Shopify metafield
    └── Shows confirmation with new balance
```

### Key Design Principles for Offline

- **Speed:** Staff lookup must return in < 500ms
- **Phone-first:** Phone number is the primary search key (most common in MENA retail)
- **Large touch targets:** Designed for tablet/mobile POS use
- **Confirmation step:** Always show "Are you sure?" before deducting points
- **Receipt:** Generate shareable confirmation (print/WhatsApp)
- **Offline resilience:** Queue transactions if connectivity drops, sync when back online

---

## 5. Shopify Limitations & Constraints

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **No native loyalty API** | Can't build inside Shopify natively | Use metafields + discount codes |
| **Metafields are read-only to customer** | Customer can't redeem directly from metafield | Need theme extension or app |
| **Discount codes = one-time** | Each redemption needs a unique code | Auto-generate via Price Rule API |
| **Webhook delivery not guaranteed** | Orders could be missed | Periodic sync job as fallback |
| **Rate limits** (40/sec for Plus, 2/sec basic) | Bulk operations throttled | Queue + backoff in Edge Function |
| **Customer matching by email only** in Shopify | Phone-based matching needs THOTH | THOTH does the matching, not Shopify |
| **No real-time points in checkout** | Without app extension, points display is delayed | Theme extension or Shopify Functions |
| **Shopify Plus required** for checkout extensibility | Basic/Standard plans have limited checkout | Theme extension works on all plans |
| **Webhook HMAC validation** | Must verify to prevent spoofed events | Edge Function validates shared secret |
| **Price Rules have limits** | Max 20M price rules per store | Clean up expired rules periodically |

### What's NOT Possible Without a Shopify App

- Modifying checkout UI (requires Checkout Extensions → Shopify Plus or App)
- Automatic discount application (customer must enter code)
- Real-time points display in standard checkout (needs theme extension)
- Customer-facing loyalty page inside Shopify (needs theme section or app proxy)

### Recommended Shopify Setup

- **Minimum:** Custom App with Admin API access token
- **Better:** Public/Custom App with storefront + admin scopes
- **Best:** Shopify App with Checkout Extensions (requires Shopify Plus)

---

## 6. Shopify API/App Setup Requirements

### Shopify Custom App (MVP)

Required scopes:
```
read_customers, write_customers
read_orders
read_products
write_price_rules
write_discounts
read_metafields, write_metafields
```

### Webhook Registrations

```
orders/create    → https://<supabase-project>.functions.supabase.co/shopify-webhook
orders/paid      → same
orders/cancelled → same
refunds/create   → same
customers/create → same
customers/update → same
```

### Supabase Edge Functions Needed

| Function | Purpose | Trigger |
|----------|---------|---------|
| `shopify-webhook` | Receives + validates all Shopify webhooks | Shopify POST |
| `shopify-sync` | Periodic full sync (safety net) | Cron / manual |
| `loyalty-redeem-online` | Handles online redemption requests | Frontend fetch |
| `shopify-register-webhooks` | One-time webhook setup | Admin action |

### Environment Secrets (Edge Function)

```
SHOPIFY_STORE_URL        # e.g., my-store.myshopify.com
SHOPIFY_ACCESS_TOKEN     # Admin API token (encrypted in DB, passed to function)
SHOPIFY_WEBHOOK_SECRET   # For HMAC validation
SUPABASE_SERVICE_KEY     # For DB writes from Edge Function
```

**Security note:** None of these touch the frontend. All Shopify API calls happen in Edge Functions only.

---

## 7. MVP vs Later

### MVP (Sprint 1-3)

| Feature | Description |
|---------|-------------|
| **Loyalty member profile** | Inside Customer360 as new tab; standalone loyalty card view |
| **Points rules engine** | Admin creates earning rules (spend-based) |
| **Manual points transactions** | Admin/staff can add/deduct/adjust points |
| **Store staff lookup** | Fast search by phone/email/name with customer card |
| **Offline purchase + redeem** | Staff adds purchase → earns points; staff redeems points |
| **Points transaction history** | Full audit trail of every point change |
| **Loyalty dashboard** | Summary metrics: members, points issued/redeemed/outstanding |
| **Tier system** | Bronze/Silver/Gold/VIP based on lifetime spend |
| **Shopify connection UI** | Settings page with connection form (credentials entry) |
| **Shopify webhook receiver** | Edge Function that receives + logs events (does not process yet) |

### Phase 2

| Feature | Description |
|---------|-------------|
| **Shopify order → auto points** | Webhook processes orders and auto-awards points |
| **Shopify customer sync** | Auto-create/update THOTH customers from Shopify |
| **THOTH → Shopify metafield sync** | Push points balance + tier to Shopify customer |
| **Online redemption** | Generate Shopify discount codes for point redemption |
| **Customer matching engine** | Smart matching with duplicate detection + merge tool |
| **Refund/cancel reversal** | Auto-reverse points on Shopify refund/cancel |

### Phase 3

| Feature | Description |
|---------|-------------|
| **Category bonus rules** | 2x points on jeans, 1.5x on accessories |
| **Campaign rules** | Double points during Eid, birthday rewards, first-purchase bonus |
| **Points expiry** | Auto-expire unused points after configurable period |
| **Rewards catalog** | Defined rewards (free item, discount, experience) |
| **Shopify theme extension** | Points widget on Shopify storefront |
| **WhatsApp notifications** | Points earned/redeemed notifications |
| **Customer merge tool** | Resolve duplicate customers across channels |
| **Analytics deep-dive** | Cohort analysis, redemption rate, repeat purchase correlation |

---

## 8. Data Model

### Entity Relationship Diagram

```
loyalty_programs (1 per workspace)
    │
    ├──── loyalty_tiers (Bronze/Silver/Gold/VIP)
    │
    ├──── loyalty_rules (earning rules)
    │         ├── spend rules
    │         ├── category bonuses
    │         └── campaign rules
    │
    ├──── loyalty_rewards (reward catalog)
    │
    └──── loyalty_members (1 per customer)
              │
              ├──── loyalty_transactions (every point change)
              │         ├── earned (from order)
              │         ├── redeemed (used for discount)
              │         ├── adjusted (manual +/-)
              │         ├── expired (auto/manual)
              │         └── reversed (from refund)
              │
              └──── loyalty_redemptions (when points used)
                        └── generates shopify discount code

shopify_connections (1 per workspace)
    │
    ├──── shopify_orders (synced orders)
    │
    └──── shopify_sync_log (all webhook events)
```

### Table Definitions

```sql
-- ═══════════════════════════════════════════════════
-- LOYALTY PROGRAM
-- ═══════════════════════════════════════════════════

CREATE TABLE loyalty_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id),
  name_en       TEXT NOT NULL DEFAULT 'Loyalty Program',
  name_ar       TEXT,
  currency      TEXT NOT NULL DEFAULT 'EGP',
  
  -- Default earning rule
  points_per_amount     INT NOT NULL DEFAULT 100,  -- points earned
  amount_per_points     NUMERIC(12,2) NOT NULL DEFAULT 10,  -- per this much currency
  -- e.g., 100 points per 10 EGP
  
  -- Redemption rule
  redemption_points     INT NOT NULL DEFAULT 1000, -- points needed
  redemption_value      NUMERIC(12,2) NOT NULL DEFAULT 10,  -- discount amount
  -- e.g., 1000 points = 10 EGP discount
  
  min_redemption_points INT DEFAULT 500,
  max_discount_amount   NUMERIC(12,2),             -- cap per redemption
  
  -- Expiry
  points_expiry_days    INT,                       -- NULL = never expire
  
  -- Channels
  earn_online           BOOLEAN NOT NULL DEFAULT TRUE,
  earn_offline          BOOLEAN NOT NULL DEFAULT TRUE,
  redeem_online         BOOLEAN NOT NULL DEFAULT TRUE,
  redeem_offline        BOOLEAN NOT NULL DEFAULT TRUE,
  
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id)  -- one program per workspace
);

-- ═══════════════════════════════════════════════════
-- TIERS
-- ═══════════════════════════════════════════════════

CREATE TABLE loyalty_tiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  program_id        UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  
  name_en           TEXT NOT NULL,   -- "Bronze", "Silver", "Gold", "VIP"
  name_ar           TEXT,
  slug              TEXT NOT NULL,   -- "bronze", "silver", "gold", "vip"
  sort_order        INT NOT NULL DEFAULT 0,
  
  -- Qualification thresholds (any one triggers upgrade)
  min_lifetime_spend    NUMERIC(14,2),  -- e.g., 5000 EGP
  min_lifetime_points   INT,
  min_order_count       INT,
  
  -- Benefits
  earning_multiplier    NUMERIC(4,2) NOT NULL DEFAULT 1.0,  -- 1.5 = 1.5x points
  birthday_bonus_points INT DEFAULT 0,
  exclusive_discount_pct NUMERIC(4,2),  -- e.g., 5.00 = 5% off
  early_access_days     INT DEFAULT 0,
  
  color                 TEXT DEFAULT '#A0A0A0',  -- for UI display
  icon                  TEXT,                     -- icon name
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id, slug)
);

-- ═══════════════════════════════════════════════════
-- EARNING RULES
-- ═══════════════════════════════════════════════════

CREATE TABLE loyalty_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  program_id        UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  
  name_en           TEXT NOT NULL,
  name_ar           TEXT,
  type              TEXT NOT NULL CHECK (type IN (
    'spend',          -- X points per Y currency
    'category_bonus', -- multiplier on specific categories
    'campaign',       -- time-limited bonus
    'first_purchase', -- one-time bonus
    'birthday',       -- birthday bonus
    'referral',       -- referral bonus
    'manual'          -- admin adjustment template
  )),
  
  -- Spend rule
  points_per_amount     INT,
  amount_per_points     NUMERIC(12,2),
  
  -- Multiplier (for category/campaign)
  multiplier            NUMERIC(4,2) DEFAULT 1.0,
  
  -- Conditions
  min_order_value       NUMERIC(12,2),
  max_points_per_order  INT,
  applicable_categories TEXT[],         -- product categories
  excluded_product_ids  TEXT[],
  excluded_discount_orders BOOLEAN DEFAULT FALSE,  -- skip discounted orders
  
  -- Campaign dates
  start_date            TIMESTAMPTZ,
  end_date              TIMESTAMPTZ,
  
  -- Channels
  channels              TEXT[] DEFAULT ARRAY['online', 'offline'],
  
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  priority              INT NOT NULL DEFAULT 0,  -- higher = checked first
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- LOYALTY MEMBERS (extends people/organizations)
-- ═══════════════════════════════════════════════════

CREATE TABLE loyalty_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  program_id        UUID NOT NULL REFERENCES loyalty_programs(id),
  
  -- Link to existing THOTH entities
  person_id         UUID REFERENCES people(id),
  organization_id   UUID REFERENCES organizations(id),
  
  -- Core identity (denormalized for fast lookup)
  member_number     TEXT NOT NULL,     -- e.g., "LYL-00001"
  name_en           TEXT NOT NULL,
  name_ar           TEXT,
  email             TEXT,
  phone             TEXT,              -- primary lookup key
  
  -- Shopify link
  shopify_customer_id TEXT,            -- Shopify customer GID
  
  -- Balances (computed from transactions, cached here)
  current_points    INT NOT NULL DEFAULT 0,
  lifetime_points   INT NOT NULL DEFAULT 0,
  redeemed_points   INT NOT NULL DEFAULT 0,
  expired_points    INT NOT NULL DEFAULT 0,
  
  -- Tier
  tier_id           UUID REFERENCES loyalty_tiers(id),
  tier_slug         TEXT DEFAULT 'bronze',
  
  -- Stats (cached, updated on each transaction)
  total_spend       NUMERIC(14,2) NOT NULL DEFAULT 0,
  order_count       INT NOT NULL DEFAULT 0,
  last_purchase_at  TIMESTAMPTZ,
  last_earn_at      TIMESTAMPTZ,
  last_redeem_at    TIMESTAMPTZ,
  
  -- Preferences
  favorite_categories TEXT[],
  opted_in          BOOLEAN NOT NULL DEFAULT TRUE,
  
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id, member_number),
  UNIQUE(workspace_id, shopify_customer_id)
);

-- Indexes for fast staff lookup
CREATE INDEX idx_loyalty_members_phone ON loyalty_members(workspace_id, phone);
CREATE INDEX idx_loyalty_members_email ON loyalty_members(workspace_id, email);
CREATE INDEX idx_loyalty_members_shopify ON loyalty_members(workspace_id, shopify_customer_id);

-- ═══════════════════════════════════════════════════
-- TRANSACTIONS (immutable audit log)
-- ═══════════════════════════════════════════════════

CREATE TABLE loyalty_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  member_id         UUID NOT NULL REFERENCES loyalty_members(id),
  
  type              TEXT NOT NULL CHECK (type IN (
    'earned',       -- points earned from purchase
    'redeemed',     -- points used for discount
    'adjusted',     -- manual admin adjustment (+/-)
    'expired',      -- auto or manual expiry
    'reversed',     -- reversal due to refund/cancel
    'bonus'         -- birthday, referral, campaign bonus
  )),
  
  points            INT NOT NULL,       -- positive for earn, negative for deduct
  balance_after     INT NOT NULL,       -- running balance after this transaction
  
  -- Source
  source            TEXT NOT NULL CHECK (source IN (
    'shopify', 'store', 'admin', 'system'
  )),
  source_channel    TEXT,               -- 'online', 'offline'
  
  -- References
  order_id          TEXT,               -- Shopify order ID or internal order ref
  order_amount      NUMERIC(12,2),      -- order total for context
  rule_id           UUID REFERENCES loyalty_rules(id),
  redemption_id     UUID,               -- links to loyalty_redemptions
  
  -- Audit
  staff_id          UUID,               -- who processed this (for store transactions)
  staff_name        TEXT,
  notes             TEXT,
  
  -- Reversal tracking
  reversed_transaction_id UUID,         -- if this reverses another transaction
  is_reversed       BOOLEAN NOT NULL DEFAULT FALSE,  -- if this was reversed
  
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- no updated_at: transactions are immutable
);

CREATE INDEX idx_loyalty_tx_member ON loyalty_transactions(member_id, created_at DESC);
CREATE INDEX idx_loyalty_tx_order ON loyalty_transactions(workspace_id, order_id);

-- ═══════════════════════════════════════════════════
-- REDEMPTIONS
-- ═══════════════════════════════════════════════════

CREATE TABLE loyalty_redemptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  member_id         UUID NOT NULL REFERENCES loyalty_members(id),
  transaction_id    UUID REFERENCES loyalty_transactions(id),
  
  points_used       INT NOT NULL,
  discount_amount   NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'EGP',
  
  channel           TEXT NOT NULL CHECK (channel IN ('online', 'offline')),
  
  -- Online: Shopify discount code
  shopify_discount_code TEXT,
  shopify_price_rule_id TEXT,
  discount_code_used    BOOLEAN DEFAULT FALSE,
  discount_code_expires TIMESTAMPTZ,
  
  -- Offline: staff info
  staff_id          UUID,
  staff_name        TEXT,
  receipt_number    TEXT,
  
  status            TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'pending', 'completed', 'expired', 'cancelled'
  )),
  
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- REWARDS CATALOG (Phase 3)
-- ═══════════════════════════════════════════════════

CREATE TABLE loyalty_rewards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  program_id        UUID NOT NULL REFERENCES loyalty_programs(id),
  
  name_en           TEXT NOT NULL,
  name_ar           TEXT,
  description_en    TEXT,
  description_ar    TEXT,
  
  type              TEXT NOT NULL CHECK (type IN (
    'discount_amount',    -- fixed EGP off
    'discount_percent',   -- % off
    'free_product',       -- specific product
    'free_shipping',      -- free delivery
    'experience'          -- VIP event, early access, etc.
  )),
  
  points_cost       INT NOT NULL,
  value             NUMERIC(12,2),     -- discount value
  
  -- Constraints
  min_tier          TEXT,              -- minimum tier to redeem
  limited_quantity  INT,               -- NULL = unlimited
  redeemed_count    INT DEFAULT 0,
  
  -- Availability
  available_online  BOOLEAN DEFAULT TRUE,
  available_offline BOOLEAN DEFAULT TRUE,
  start_date        TIMESTAMPTZ,
  end_date          TIMESTAMPTZ,
  
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  image_url         TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- SHOPIFY CONNECTION
-- ═══════════════════════════════════════════════════

CREATE TABLE shopify_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  
  store_url         TEXT NOT NULL,      -- my-store.myshopify.com
  access_token_enc  TEXT,               -- encrypted access token
  webhook_secret    TEXT,               -- for HMAC validation
  
  -- Status
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'connected', 'error', 'disconnected'
  )),
  last_sync_at      TIMESTAMPTZ,
  last_error        TEXT,
  
  -- Sync settings
  sync_customers    BOOLEAN DEFAULT TRUE,
  sync_orders       BOOLEAN DEFAULT TRUE,
  auto_award_points BOOLEAN DEFAULT TRUE,
  auto_sync_metafields BOOLEAN DEFAULT TRUE,
  
  -- Registered webhooks
  webhook_ids       JSONB DEFAULT '[]',
  
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id)
);

-- ═══════════════════════════════════════════════════
-- SHOPIFY ORDERS (synced from Shopify)
-- ═══════════════════════════════════════════════════

CREATE TABLE shopify_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  
  shopify_order_id  TEXT NOT NULL,
  shopify_order_number TEXT,
  shopify_customer_id TEXT,
  
  -- Denormalized order data
  email             TEXT,
  phone             TEXT,
  customer_name     TEXT,
  total_amount      NUMERIC(14,2) NOT NULL,
  subtotal_amount   NUMERIC(14,2),
  currency          TEXT DEFAULT 'EGP',
  financial_status  TEXT,              -- 'paid', 'refunded', 'partially_refunded'
  fulfillment_status TEXT,
  
  -- Points
  member_id         UUID REFERENCES loyalty_members(id),
  points_awarded    INT DEFAULT 0,
  points_reversed   INT DEFAULT 0,
  
  -- Line items (stored as JSONB for reference)
  line_items        JSONB DEFAULT '[]',
  
  -- Processing status
  processed         BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at      TIMESTAMPTZ,
  error             TEXT,
  
  order_created_at  TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id, shopify_order_id)
);

-- ═══════════════════════════════════════════════════
-- SYNC LOG (all webhook events, raw)
-- ═══════════════════════════════════════════════════

CREATE TABLE shopify_sync_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  
  event_type        TEXT NOT NULL,      -- 'orders/paid', 'customers/create', etc.
  shopify_id        TEXT,               -- the Shopify resource ID
  payload           JSONB NOT NULL,     -- raw webhook payload
  
  status            TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'processing', 'processed', 'failed', 'skipped'
  )),
  error             TEXT,
  processed_at      TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_log_workspace ON shopify_sync_log(workspace_id, created_at DESC);

-- ═══════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════

ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_sync_log ENABLE ROW LEVEL SECURITY;

-- Pattern: workspace members can read, admins can write
-- (Same pattern as existing THOTH tables)
```

### Why This Structure

- **`loyalty_members` separate from `people`**: Not every person is a loyalty member. Links via `person_id` FK but has its own fast-lookup fields (phone, email) for POS performance.
- **`loyalty_transactions` is immutable**: Never update a transaction. Reversals create new transactions. This is the audit trail.
- **Cached balances on `loyalty_members`**: `current_points` is denormalized for fast reads. Recalculated from transactions if drift suspected.
- **`shopify_sync_log` stores raw payloads**: For debugging, replay, and audit. Separate from the processed `shopify_orders`.

---

## 9. Security Design

### Roles & Permissions

| Capability | Admin | Store Staff | Viewer | Finance |
|------------|:-----:|:----------:|:------:|:-------:|
| View loyalty dashboard | ✓ | ✓ | ✓ | ✓ |
| Search customers | ✓ | ✓ | ✓ | ✓ |
| View customer loyalty profile | ✓ | ✓ | ✓ | ✓ |
| Add offline purchase | ✓ | ✓ | ✗ | ✗ |
| Redeem points (offline) | ✓ | ✓ | ✗ | ✗ |
| Manually adjust points | ✓ | ✗ | ✗ | ✗ |
| Create/edit earning rules | ✓ | ✗ | ✗ | ✗ |
| Create/edit tiers | ✓ | ✗ | ✗ | ✗ |
| Connect/disconnect Shopify | ✓ | ✗ | ✗ | ✗ |
| View sync logs | ✓ | ✗ | ✗ | ✗ |
| View points liability report | ✓ | ✗ | ✗ | ✓ |
| Export transaction data | ✓ | ✗ | ✗ | ✓ |

### Security Constraints

1. **Shopify credentials never in frontend** — stored encrypted in `shopify_connections`, only read by Edge Functions
2. **Webhook HMAC validation** — every Shopify webhook is verified before processing
3. **Points manipulation only via transactions** — no direct balance updates; balance = SUM(transactions)
4. **Staff identification on every action** — offline transactions require `staff_id`
5. **Rate limiting** — Edge Functions rate-limited to prevent abuse
6. **RLS on all tables** — multi-tenant isolation via `workspace_id`
7. **No service key in frontend** — same THOTH security model
8. **Audit trail** — every point change has a `loyalty_transaction` record

---

## 10. Store Staff UX Journey

### Primary Flow: Customer Lookup + Action

```
┌─────────────────────────────────────────────────────────┐
│  🔍  Search customer...                           ⌫    │
│                                                         │
│  Search by phone, email, name, or loyalty ID            │
└─────────────────────────────────────────────────────────┘

          ↓ staff types "0101234"

┌─────────────────────────────────────────────────────────┐
│  Results                                                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ AM  Ahmed Mohamed              Gold ●             │  │
│  │     01012345678 · ahmed@email.com                 │  │
│  │     12,450 pts · Last: 3 days ago                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ AH  Ahmed Hassan               Silver ●           │  │
│  │     01012345689 · ...                             │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

          ↓ staff taps Ahmed Mohamed

┌─────────────────────────────────────────────────────────┐
│                                                         │
│     ┌──────────────────────────────────┐                │
│     │         AHMED MOHAMED            │                │
│     │            ★ Gold                │                │
│     │                                  │                │
│     │     12,450 points                │                │
│     │     ─────────────────            │                │
│     │     ███████████░░░  → VIP        │                │
│     │     8,500 EGP until VIP          │                │
│     └──────────────────────────────────┘                │
│                                                         │
│  Total Spend      Orders     Last Purchase              │
│  41,500 EGP       12         3 days ago                 │
│                                                         │
│  ┌─────────────┐  ┌──────────────────┐                  │
│  │  🎁 Redeem  │  │  ➕ Add Purchase  │                  │
│  │   Points    │  │                  │                  │
│  └─────────────┘  └──────────────────┘                  │
│                                                         │
│  Recent Activity                                        │
│  ● Earned 5,000 pts · Store · Jun 7                     │
│  ● Redeemed 2,000 pts · Online · Jun 3                  │
│  ● Earned 3,200 pts · Shopify · May 28                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

1. **One search bar, huge** — 60%+ of screen width, auto-focus on page load
2. **Results appear as-you-type** — debounced 300ms, search phone/email/name
3. **Customer card = visual identity** — tier badge, points balance, progress bar
4. **Two primary actions** — Redeem and Add Purchase are the only CTAs
5. **Confirmation on every action** — modal with summary before executing
6. **Success state = clear** — green checkmark, new balance shown, animation
7. **Mobile-first layout** — works on iPad and phone in portrait mode
8. **Offline queue** — if no connectivity, transactions queue and sync later

### UX Feel

The staff lookup should feel like an **Apple Wallet card** — not a spreadsheet. The customer card should feel like holding their membership card. Clean, large type, clear hierarchy, instant.

---

## 11. Screen Inventory

### New Pages

| # | Screen | Route | Description |
|---|--------|-------|-------------|
| 1 | **Loyalty Dashboard** | `/loyalty` | Summary metrics, charts, top members |
| 2 | **Loyalty Settings** | `/loyalty/settings` | Program config, tiers, rules |
| 3 | **Staff Lookup** | `/loyalty/lookup` | POS-style customer search |
| 4 | **Points Rules** | `/loyalty/rules` | Rule management (CRUD) |
| 5 | **Rewards Catalog** | `/loyalty/rewards` | Reward management (Phase 3) |
| 6 | **Shopify Connection** | `/loyalty/shopify` | Connection setup + sync status |
| 7 | **Sync Logs** | `/loyalty/shopify/logs` | Webhook event log |
| 8 | **Transactions** | `/loyalty/transactions` | Global points transaction list |
| 9 | **Member Profile** | `/loyalty/members/:id` | Full loyalty member detail |

### Extended Existing Pages

| Page | Extension |
|------|-----------|
| **Customer360** | New "Loyalty" tab — member card, points, transactions, tier |
| **People 360°** | Loyalty summary card in sidebar if member exists |
| **Sidebar** | New "Loyalty" section with icon (Gift or Star) |

---

## 12. Rule Engine

### How Rules Are Evaluated

```
Order comes in (amount: 1000 EGP, category: "jeans")
    │
    ▼
1. Get active rules, sorted by priority DESC
2. Find applicable spend rule → 100 pts per 10 EGP → 10,000 base points
3. Check category bonuses → jeans = 2x → 20,000 points
4. Check active campaigns → Eid double points → 40,000 points
5. Check tier multiplier → Gold = 1.5x → 60,000 points
6. Apply caps → max 50,000 per order → 50,000 points
7. Check minimum order → 1000 > 50 minimum → passes
8. Final: 50,000 points
```

### Rule Priority

Rules stack but can be capped:

1. **Base spend rule** — always applies
2. **Category bonus** — multiplier on top of base
3. **Campaign** — multiplier on top of category
4. **Tier multiplier** — multiplier on top of everything
5. **Cap** — final cap per rule or per order

Admin can configure whether multipliers **stack** or take **highest only**.

---

## 13. Customer Matching Logic

### Priority Chain

```
Shopify order arrives with: email, phone, customer_id, name
    │
    ▼
1. shopify_customer_id → exact match on loyalty_members.shopify_customer_id
   Found? → Use this member
    │
    ▼
2. Email → exact match on loyalty_members.email
   Found? → Link Shopify ID, use this member
    │
    ▼
3. Phone → normalized match on loyalty_members.phone
   Found? → Link Shopify ID, use this member
    │
    ▼
4. Name + Phone partial → fuzzy match
   Found with high confidence? → Link, use
   Found with low confidence? → Flag for manual review
    │
    ▼
5. No match → Create new loyalty_member from Shopify customer data
   Also create/link to THOTH people record
```

### Phone Normalization

```
Input: "+20 101 234 5678"  → "201012345678"
Input: "01012345678"       → "201012345678" (assumes EG country code)
Input: "1012345678"        → "201012345678"
```

### Duplicate Detection

When matching produces low confidence:
- Flag in `customer_merge_candidates` table (Phase 3)
- Show in admin dashboard
- Admin can merge or dismiss

---

## 14. Tier System

### Default Tiers

| Tier | Lifetime Spend | Earning Multiplier | Color |
|------|---------------|-------------------|-------|
| Bronze | 0 EGP | 1.0x | `#CD7F32` |
| Silver | 5,000 EGP | 1.25x | `#C0C0C0` |
| Gold | 15,000 EGP | 1.5x | `#FFD700` |
| VIP | 50,000 EGP | 2.0x | `#1a1a1a` |

### Tier Evaluation

- Recalculated after each purchase
- **Upgrade:** immediate when threshold crossed
- **Downgrade:** evaluated annually (grace period)
- Admin can manually assign/override tier
- Tier changes logged as events

### Visual

The tier badge and progress bar are the most prominent visual elements on the loyalty card. Design inspiration:

- Apple Wallet card gradient
- Zara membership gold/black
- Premium metal card aesthetic
- Progress bar shows % to next tier with "X EGP until [Next Tier]"

---

## 15. Implementation Plan

### Sprint L1: Foundation + Staff Lookup (MVP Core)

**Goal:** Loyalty member profiles, manual transactions, store staff lookup

**New files:**
- `src/pages/Loyalty.tsx` — Dashboard
- `src/pages/LoyaltyLookup.tsx` — Staff POS lookup
- `src/pages/LoyaltySettings.tsx` — Admin settings
- `src/pages/LoyaltyMember.tsx` — Member detail page
- `src/pages/LoyaltyTransactions.tsx` — Transaction list
- `src/data/loyalty.ts` — Types, demo data, meta maps
- `supabase/migrations/loyalty-foundation.sql` — Tables + RLS

**Changes to existing files:**
- `src/components/Sidebar.tsx` — Add Loyalty nav section
- `src/App.tsx` — Add routes
- `src/lib/database.types.ts` — Add loyalty table types
- `src/lib/data-source.ts` — Add loyalty adapters
- `src/pages/Customer360.tsx` — Add Loyalty tab

**Deliverables:**
- Loyalty dashboard with metrics (demo data)
- Staff lookup with phone/email/name search
- Customer loyalty card (membership card UI)
- Manual add purchase → earn points
- Manual redeem points
- Points transaction history
- Tier display + progress bar
- Program settings (earning rate, redemption rate)
- Tier configuration

### Sprint L2: Rules Engine + Shopify Connection

**Goal:** Configurable rules, Shopify connection UI, webhook receiver

**New files:**
- `src/pages/LoyaltyRules.tsx` — Rule CRUD
- `src/pages/ShopifyConnection.tsx` — Connection setup
- `src/pages/ShopifySyncLogs.tsx` — Event log
- `supabase/functions/shopify-webhook/` — Edge Function
- `supabase/functions/shopify-register-webhooks/` — Setup function

**Deliverables:**
- Rule engine UI (create/edit spend rules, category bonuses)
- Shopify connection settings page
- Webhook receiver Edge Function (receive + log + validate)
- Sync log viewer
- Connection status indicator

### Sprint L3: Live Shopify Sync

**Goal:** Auto-process Shopify orders, award points, sync metafields

**Deliverables:**
- Order processing in webhook handler
- Customer matching engine
- Auto points calculation from rules
- THOTH → Shopify metafield sync
- Refund/cancel reversal
- Error handling + retry

### Sprint L4: Online Redemption + Campaigns

**Goal:** Generate Shopify discount codes, campaign rules

**Deliverables:**
- Online redemption flow
- Discount code generation via Price Rule API
- Campaign rules (date-bounded, multipliers)
- Birthday/first-purchase bonuses
- Points expiry system

### Sprint L5: Analytics + Polish

**Goal:** Deep analytics, rewards catalog, customer merge tool

**Deliverables:**
- Analytics dashboard (cohorts, redemption rates, repeat purchase)
- Rewards catalog
- Customer merge tool
- WhatsApp notification integration
- Export functionality

---

## Design Language Notes

All loyalty screens must follow THOTH design language:

- **Fonts:** Playfair Display (serif headings), DM Sans (body)
- **Colors:** Warm White, Soft Sage, Light Stone, Soft Graphite, Muted Lilac Accent
- **Components:** rounded-xl borders, border-border/40, subtle shadows
- **Cards:** Same card pattern as People/Organizations/Sales cards
- **Mobile-first:** Especially Staff Lookup — must work on iPad
- **Bilingual:** Full EN/AR with RTL support
- **Premium:** Not ERP. Think Zara membership app meets Apple Wallet

The loyalty card specifically should have:
- Subtle gradient background (tier-colored)
- Large, confident typography for points balance
- Membership number in monospace
- Tier badge with metallic feel (CSS gradient)
- Progress bar with soft animation
- Activity timeline with clean dot indicators
