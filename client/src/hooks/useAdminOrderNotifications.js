import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const ADMIN_EMAIL = 'navneeldutta@gmail.com';

/**
 * useAdminOrderNotifications
 *
 * Runs globally in AppContent. When the logged-in user is the admin,
 * this hook:
 *   1. Requests browser Notification permission (once).
 *   2. Registers a Supabase Realtime subscription on `orders` INSERT events.
 *   3. On each new order, fires a Service-Worker-backed OS notification.
 *
 * Works across all devices / tabs where the admin is logged in.
 */
export function useAdminOrderNotifications() {
  const channelRef = useRef(null);
  const swRegRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // ── 1. Check if Notification API is supported ──────────────────
      if (!('Notification' in window)) return;

      // ── 2. Verify the logged-in user is admin ──────────────────────
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const userEmail = session.user.email;

      // Check role in profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const isAdmin =
        userEmail === ADMIN_EMAIL && profile?.role === 'admin';

      if (!isAdmin || cancelled) return;

      // ── 3. Request / confirm Notification permission ────────────────
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return;

      // ── 4. Register Service Worker (if not already registered) ──────
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          swRegRef.current = reg;
          // Ensure SW is active
          await navigator.serviceWorker.ready;
        } catch (err) {
          console.warn('[AdminNotif] SW registration failed:', err);
        }
      }

      // ── 5. Subscribe to Supabase Realtime orders INSERT ─────────────
      const channel = supabase
        .channel('admin-order-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            if (cancelled) return;
            handleNewOrder(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[AdminNotif] ✅ Realtime order notifications active');
          }
        });

      channelRef.current = channel;
    }

    init().catch((err) => console.error('[AdminNotif] init error:', err));

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // run once on mount
}

// ── Helper: dispatch notification via SW or fallback ─────────────
function handleNewOrder(order) {
  const orderId = order.id || order.tracking_id || 'N/A';
  const customerName =
    order.customer_name ||
    order.shipping_address?.name ||
    'Customer';
  const total =
    order.total ?? order.total_price ?? order.subtotal ?? '?';
  const payMethod = order.pay_method || order.payment_type || 'Online';

  const payload = {
    type: 'NEW_ORDER',
    orderId,
    customerName,
    total,
    payMethod,
  };

  // Prefer Service Worker notification (works when tab is in background)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(payload);
  } else if (navigator.serviceWorker) {
    // SW registered but not yet controlling — use ready registration
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage(payload);
    });
  } else {
    // Final fallback: direct Notification API
    try {
      const n = new Notification('🛍️ New Order Received!', {
        body: `Order #${String(orderId).slice(-8).toUpperCase()}\n₹${total} · ${customerName} · ${payMethod}`,
        icon: '/logo192.png',
        tag: `order-${orderId}`,
      });
      n.onclick = () => {
        window.focus();
        window.location.href = '/admin';
      };
    } catch (_) {}
  }
}
