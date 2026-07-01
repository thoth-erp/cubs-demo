/**
 * Shopify auto-push — fire-and-forget product export.
 *
 * Called after a product is created/edited in THOTH so the store stays
 * current without waiting for a manual "Sync" or the scheduled run.
 * Respects the connection's sync direction: only pushes when products
 * are set to "export" or "both". Failures are silent here — every push
 * is recorded in shopify_sync_runs / Sync Logs either way.
 */

import { supabase, isDemoMode } from "./supabase";

interface ConnRow {
  is_connected: boolean;
  sync_config?: { entities?: { products?: string } } | null;
}

export async function maybePushProductsToShopify(workspaceId: string): Promise<void> {
  if (isDemoMode || !supabase || !workspaceId || workspaceId === "demo") return;
  try {
    const { data } = await supabase
      .from("shopify_connections")
      .select("is_connected, sync_config")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const conn = data as ConnRow | null;
    const dir = conn?.sync_config?.entities?.products;
    if (!conn?.is_connected || (dir !== "export" && dir !== "both")) return;
    await supabase.functions.invoke("shopify-sync", {
      body: { action: "push_products", workspace_id: workspaceId },
    });
  } catch {
    // best-effort background push — the next manual/scheduled sync catches up
  }
}
