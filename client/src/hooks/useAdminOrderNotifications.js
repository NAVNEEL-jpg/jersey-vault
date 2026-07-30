import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabase';

const ADMIN_EMAIL = 'navneeldutta@gmail.com';

/**
 * useAdminOrderNotifications
 *
 * Returns:
 *   - permissionStatus: 'default' | 'granted' | 'denied' | 'unsupported'
 *   - isSubscribed: boolean — true when Realtime channel is active
 *   - isAdmin: boolean
 *   - enableNotifications: async function — call on a button click to request permission + subscribe
 */
// ── Global Singleton for Realtime Channel ───────────────────────
let globalChannel = null;
let activeHookInstances = 0;

export function useAdminOrderNotifications() {
  const [permissionStatus, setPermissionStatus] = useState(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  });
  const [isSubscribed, setIsSubscribed] = useState(!!globalChannel);
  const [isAdmin, setIsAdmin] = useState(false);
  const isAdminRef = useRef(false);

  // ── Track Hook Instances for Safe Cleanup ─────────────────────
  useEffect(() => {
    activeHookInstances++;
    return () => {
      activeHookInstances--;
      if (activeHookInstances === 0 && globalChannel) {
        supabase.removeChannel(globalChannel);
        globalChannel = null;
      }
    };
  }, []);

  // ── Check if logged-in user is admin (on mount) ───────────────
  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;

      const userEmail = session.user.email;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const admin = userEmail === ADMIN_EMAIL && profile?.role === 'admin';
      if (!cancelled) {
        setIsAdmin(admin);
        isAdminRef.current = admin;
      }

      // If permission already granted, auto-subscribe (no click needed)
      if (admin && !cancelled && Notification.permission === 'granted') {
        subscribeRealtime();
      }
    }

    checkAdmin().catch(console.error);
    return () => { cancelled = true; };
  }, []);

  // ── Register Service Worker ───────────────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    } catch (err) {
      console.warn('[AdminNotif] SW registration failed:', err);
    }
  }

  // ── Subscribe to Supabase Realtime ────────────────────────────
  function subscribeRealtime() {
    if (globalChannel) {
      setIsSubscribed(true);
      return; // Already subscribed by another hook instance
    }

    registerSW();

    globalChannel = supabase
      .channel('admin-order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          handleNewOrder(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[AdminNotif] ✅ Realtime order notifications active');
          setIsSubscribed(true);
        }
      });
  }

  // ── Called when admin clicks "Enable Notifications" button ────
  const enableNotifications = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (!isAdminRef.current) return;

    // This MUST be called from a user gesture (button click) for Chrome to show the popup
    const result = await Notification.requestPermission();
    setPermissionStatus(result);

    if (result === 'granted') {
      subscribeRealtime();
    }
  }, []);

  return { permissionStatus, isSubscribed, isAdmin, enableNotifications };
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

  // Prefer Service Worker (works when tab is in background)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(payload);
  } else if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage(payload);
    });
  } else {
    // Fallback: direct Notification API
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
