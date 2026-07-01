import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "./context/LanguageContext";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Logo } from "./components/Logo";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// ── CUBS demo modules (only 4) ──
const CubsProductsPage = lazy(() => import("./pages/cubs/Products"));
const CubsRawMaterialsPage = lazy(() => import("./pages/cubs/RawMaterials"));
const CubsAssetsPage = lazy(() => import("./pages/cubs/Assets"));
const InventoryLanding = lazy(() => import("./pages/cubs/InventoryLanding"));
const CubsProcurementPage = lazy(() => import("./pages/cubs/Procurement"));
const LoyaltyDashboard = lazy(() => import("./pages/Loyalty"));
const LoyaltyLookup = lazy(() => import("./pages/LoyaltyLookup"));
const LoyaltyMemberPage = lazy(() => import("./pages/LoyaltyMember"));
const LoyaltyTransactionsPage = lazy(() => import("./pages/LoyaltyTransactions"));
const LoyaltyRulesPage = lazy(() => import("./pages/LoyaltyRules"));
const LoyaltySettingsPage = lazy(() => import("./pages/LoyaltySettings"));
const LoyaltyRedemptionsPage = lazy(() => import("./pages/LoyaltyRedemptions"));
const LoyaltyCampaignsPage = lazy(() => import("./pages/LoyaltyCampaigns"));
const LoyaltyAnalyticsPage = lazy(() => import("./pages/LoyaltyAnalytics"));
const LoyaltyRewardsPage = lazy(() => import("./pages/LoyaltyRewards"));
const LoyaltyMergePage = lazy(() => import("./pages/LoyaltyMerge"));
const LoyaltyNotificationsPage = lazy(() => import("./pages/LoyaltyNotifications"));
const ShopifyConnectionPage = lazy(() => import("./pages/ShopifyConnection"));
const ShopifySyncLogsPage = lazy(() => import("./pages/ShopifySyncLogs"));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Logo variant="full" size={20} />
        <Loader2 size={16} className="animate-spin text-muted-foreground/50" />
      </div>
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background font-sans">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <ShellInner>
      <Suspense fallback={<LoadingScreen />}>
      <Switch>
        {/* ── Products ── */}
        <Route path="/products" component={CubsProductsPage} />

        {/* ── Inventory ── */}
        <Route path="/inventory" component={InventoryLanding} />
        <Route path="/inventory/raw-materials" component={CubsRawMaterialsPage} />
        <Route path="/inventory/assets" component={CubsAssetsPage} />

        {/* ── Procurement ── */}
        <Route path="/procurement" component={CubsProcurementPage} />

        {/* ── Loyalty ── */}
        <Route path="/loyalty/members/:id" component={LoyaltyMemberPage} />
        <Route path="/loyalty/lookup" component={LoyaltyLookup} />
        <Route path="/loyalty/transactions" component={LoyaltyTransactionsPage} />
        <Route path="/loyalty/rules" component={LoyaltyRulesPage} />
        <Route path="/loyalty/redemptions" component={LoyaltyRedemptionsPage} />
        <Route path="/loyalty/campaigns" component={LoyaltyCampaignsPage} />
        <Route path="/loyalty/analytics" component={LoyaltyAnalyticsPage} />
        <Route path="/loyalty/rewards" component={LoyaltyRewardsPage} />
        <Route path="/loyalty/merge" component={LoyaltyMergePage} />
        <Route path="/loyalty/notifications" component={LoyaltyNotificationsPage} />
        <Route path="/loyalty/shopify" component={ShopifyConnectionPage} />
        <Route path="/loyalty/sync-logs" component={ShopifySyncLogsPage} />
        <Route path="/loyalty/settings" component={LoyaltySettingsPage} />
        <Route path="/loyalty" component={LoyaltyDashboard} />

        {/* ── Default: go to products ── */}
        <Route path="/" component={CubsProductsPage} />
        <Route>
          <div className="h-full w-full flex items-center justify-center bg-background">
            <div className="text-center space-y-3 max-w-[320px]">
              <p className="text-[14px] font-medium text-foreground">Page not found</p>
              <p className="text-[12px] text-muted-foreground">The page you're looking for doesn't exist.</p>
            </div>
          </div>
        </Route>
      </Switch>
      </Suspense>
    </ShellInner>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <LanguageProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </LanguageProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
