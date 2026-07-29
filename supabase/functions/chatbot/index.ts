import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const ALLOWED_ORIGINS = [
  'https://www.thejerseyvault.in',
  'https://thejerseyvault.in',
  'http://localhost:3000',  // dev
  'http://localhost:5000',  // dev
];

function getCorsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Admin panel stores status as strings: pending, preparing, shipped, delivered
const statusLabels: Record<string, string> = {
  pending:   "ORDER PLACED",
  preparing: "PACKED & PREPARING",
  shipped:   "SHIPPED",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

function extractOrderOrTrackingId(text: string): string | null {
  if (!text) return null;
  const patterns = [
    /\bTRK-[A-Z0-9]{6}\b/i,
    /\bpay_[a-zA-Z0-9]+\b/i,
    /\border_[a-zA-Z0-9]+\b/i,
    /\bCOD-[0-9]+\b/i,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].toUpperCase();
  }
  return null;
}

async function fetchOrderDetails(supabaseClient: any, idOrTrackingId: string) {
  try {
    const cleanId = idOrTrackingId.trim().toUpperCase();
    const { data, error } = await supabaseClient
      .from('orders')
      .select('id, tracking_id, status, created_at, customer_name, total, items, shipping_address')
      .or(`tracking_id.eq.${cleanId},id.eq.${cleanId}`)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Database query error in supabase chatbot:', err);
    return null;
  }
}

function extractJerseySearchTerms(text: string): string[] {
  const lowercaseText = text.toLowerCase();
  
  // 1. Check for common country and team keywords first
  const commonTeamsAndCountries = [
    "real madrid", "barcelona", "barca", "arsenal", "chelsea", "liverpool", "manchester united", "man united", "man city", "manchester city",
    "psg", "bayern", "juventus", "inter milan", "ac milan", "argentina", "brazil", "france", "portugal", "germany",
    "spain", "italy", "england", "india", "croatia", "morocco", "japan", "mexico", "al nassr", "inter miami",
    "world cup", "wc", "retro"
  ];
  
  const found: string[] = [];
  for (const team of commonTeamsAndCountries) {
    if (lowercaseText.includes(team)) {
      found.push(team);
    }
  }
  
  // If nothing from common list is found, let's look for specific nouns (at least 4 chars)
  if (found.length === 0) {
    const words = lowercaseText.split(/\s+/);
    const stopWords = new Set([
      "what", "how", "where", "when", "who", "which", "available", "have", "stock", "this", "that", 
      "your", "with", "from", "jersey", "jerseys", "size", "chart", "free", "ship", "return", 
      "refund", "payment", "hello", "hi", "hey", "support", "help", "thanks", "thank", "you", 
      "please", "track", "order", "status", "delivery", "sell", "purchase", "find", "shop", "want"
    ]);
    for (const w of words) {
      const cleanW = w.replace(/[^a-z0-9]/g, '');
      if (cleanW.length >= 4 && !stopWords.has(cleanW)) {
        found.push(cleanW);
      }
    }
  }
  
  return found;
}

async function findAvailableJerseys(supabaseClient: any, terms: string[]) {
  if (terms.length === 0) return [];
  
  try {
    const orQuery = terms.map(t => `name.ilike.%${t}%`).join(',');
    const { data, error } = await supabaseClient
      .from('products')
      .select('id, name, price, type, stock, status')
      .eq('status', 'active')
      .or(orQuery)
      .limit(5);
      
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error searching products in database:', err);
    return [];
  }
}

function getLocalResponse(message: string, orderDetails: any, matchedJerseys: any[] | null, searchTerms: string[] | null): string {
  const msg = message.toLowerCase();

  // 1. Order tracking details query
  if (orderDetails) {
    const orderStatus = (orderDetails.status || '').toLowerCase();
    const statusText = statusLabels[orderStatus] || 'UNKNOWN';
    const itemsList = (orderDetails.items || [])
      .map((item: any) => `- ${item.name} (${item.size}) x${item.qty}`)
      .join('\n');
    
    let additionalInfo = '';
    if (orderStatus === 'cancelled') {
      additionalInfo = `\n\n❌ **Cancelled:** This order has been cancelled. If you have any questions, feel free to contact our support team.`;
    } else if (orderStatus === 'shipped') { // Shipped — show Delhivery tracking
      additionalInfo =
        `\n\n🚚 **Your order has been shipped!**\n\n` +
        `The order ID sent to the invoice in your mail can be used to track the shipment on the Delhivery track website.\n\n` +
        `👉 **[Track your shipment on Delhivery](https://www.delhivery.com/track/package/)**\n\n` +
        `Simply enter your Order ID / AWB number on the Delhivery tracking page to see live delivery updates.`;
    } else if (orderStatus === 'delivered') { // Delivered
      additionalInfo = `\n\n✅ **Delivered:** This order has been successfully delivered. Thank you for shopping with JerseyVault! If you have any sizing or return queries, feel free to contact us.`;
    } else { // pending or preparing — not yet shipped
      additionalInfo =
        `\n\n📦 **Not yet shipped.** Your order is currently being **${statusText}**. ` +
        `Once it is dispatched, you will receive a shipping confirmation email with your invoice and Order ID, ` +
        `which you can use to track the shipment on the Delhivery track website.\n\n` +
        `👉 **[Delhivery Tracking Website](https://www.delhivery.com/track/package/)**`;
    }

    const stepMap: Record<string, string> = { pending: '1/4', preparing: '2/4', shipped: '3/4', delivered: '4/4', cancelled: 'CANCELLED' };
    return `I found your order **${orderDetails.tracking_id || orderDetails.id}**:\n\n` +
           `📦 **Status:** ${statusText} (Step ${stepMap[orderStatus] || '?/4'})\n` +
           `📅 **Ordered On:** ${new Date(orderDetails.created_at).toLocaleDateString()}\n\n` +
           `**Items:**\n${itemsList || 'None'}${additionalInfo}\n\n` +
           `Please note that standard delivery takes 5–8 business days. If you need any assistance, feel free to WhatsApp our team at **+91 70297 86817**!`;
  }

  // 2. Specific FAQ checks (High Priority to prevent keyword collision)
  if (msg.includes('size') || msg.includes('fit') || msg.includes('shrink') || msg.includes('guide') || msg.includes('chart')) {
    return `Here is our official **Size Chart** (measurements in inches):\n\n` +
           `| Size | Chest (Fan Version) | Chest (Player Version) | Length |\n` +
           `| :---: | :---: | :---: | :---: |\n` +
           `| **S** | 38" | 36" | 27" |\n` +
           `| **M** | 40" | 38" | 28" |\n` +
           `| **L** | 42" | 40" | 29" |\n` +
           `| **XL** | 44" | 42" | 30" |\n` +
           `| **XXL** | 46" | 44" | 31" |\n\n` +
           `💡 **Fan vs Player Version:**\n` +
           `- **Fan Version:** Slightly looser, standard comfort fit.\n` +
           `- **Player Version:** Slim performance fit, runs tighter.\n` +
           `- Football jerseys run slim, so if you prefer a relaxed fit or are between sizes, we highly recommend **sizing up**.\n\n` +
           `🧼 **Care Instructions:** Made of 100% premium polyester. Do not shrink if cold-washed (gentle cycle) and air-dried. Do not iron prints directly.\n\n` +
           `For more details, visit our **[FAQ Page](/faq)**.`;
  }

  if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange') || msg.includes('replace')) {
    return `Here is our Return & Refund Policy:\n` +
           `- 🔄 **3-Days Return Policy:** Returns/exchanges are accepted within **3 days** of delivery, only if the product is manufacturer-damaged, torn, or if there is an ordered size mismatch.\n` +
           `- 📹 **Unboxing Video Mandatory:** A continuous, unedited unboxing video from start to finish is a **must** to claim any return or refund.\n` +
           `- ✉️ **Initiation Period:** At least **7 days** are required to process and initiate a return. You must request the return by emailing us at **support.jerseyvault@gmail.com**.\n\n` +
           `For further details, visit our **[FAQ Page](/faq)** or contact support on WhatsApp at **+91 70297 86817**.`;
  }

  if (msg.includes('shipping') || msg.includes('charge') || msg.includes('cost') || msg.includes('free')) {
    return `🚚 **Shipping Information:**\n` +
           `- **Delivery Time:** Standard shipping takes 5–8 business days across India. Metro cities (like Mumbai, Delhi, bandwidth, Kolkata) typically arrive within 3–5 business days.\n` +
           `- **Shipping Fee:** Free shipping on orders above ₹1,099! For orders below ₹1,099, there is a flat shipping fee of ₹99.\n` +
           `- **International:** We currently only ship within India, but international shipping is in the works!\n\n` +
           `You can view our shipping FAQs on the **[FAQ Page](/faq)**.`;
  }

  if (msg.includes('payment') || msg.includes('cod') || msg.includes('cash')) {
    return `💳 **Payment Options:**\n` +
           `- We accept UPI (PhonePe, GPay, Paytm), Credit/Debit Cards, Net Banking, and **Cash on Delivery (COD)**.\n` +
           `- Online payments are handled securely via Razorpay.\n` +
           `- Please note: Cash on Delivery (COD) orders attract a flat COD convenience fee of **₹30**.\n\n` +
           `You can view our payment terms on the **[FAQ Page](/faq)**.`;
  }

  if (msg.includes('authentic') || msg.includes('replica') || msg.includes('original')) {
    return `We offer both official licensed jerseys and high-quality fan replicas. Each product details page clearly states whether it is a "Replica" or "Official Licensed" jersey. We believe in absolute transparency and never misrepresent our products.`;
  }

  if (msg.includes('contact') || msg.includes('support') || msg.includes('whatsapp') || msg.includes('instagram') || msg.includes('phone') || msg.includes('human') || msg.includes('email')) {
    return `You can reach our customer support team directly here:\n` +
           `📞 **WhatsApp Support (India):** +91 70297 86817\n` +
           `🌎 **WhatsApp (International):** +1 (579) 475-9370 or +1 (604) 200-9964\n` +
           `📸 **Instagram DM:** @the_jerseyvault.in\n` +
           `✉️ **Email:** support.jerseyvault@gmail.com\n\n` +
           `You can find more contact channels on the **[Contact Us Page](/contact)**.\n` +
           `Support hours are Monday – Saturday (10:00 AM – 8:00 PM IST) and Sunday (11:00 AM – 5:00 PM IST).`;
  }

  // 3. Navigation & Page routing checks
  if (msg.includes('cart') || msg.includes('bag') || msg.includes('basket')) {
    return `You can open your shopping cart sidebar at any time by clicking the **[Shopping Cart](/cart)** link or the **CART** icon in the header of our **[Home Page](/)**!`;
  }

  if (msg.includes('checkout') || msg.includes('buy') || msg.includes('purchase') || msg.includes('pay')) {
    return `You can complete your purchase and place your order directly on our **[Checkout Page](/checkout)**. Please make sure to add your desired jerseys to your cart first!`;
  }

  if (msg.includes('home') || msg.includes('homepage') || msg.includes('back to home') || msg.includes('main page') || msg.includes('landing')) {
    return `You can navigate back to our main store front on the **[Home Page](/)** to browse all featured jerseys, search products, and view hot drops.`;
  }

  if (msg.includes('my orders') || msg.includes('myorder') || msg.includes('order history') || msg.includes('past orders') || msg.includes('receipt')) {
    return `You can view your complete order history, check statuses, and access your invoices on the **[My Orders Page](/myorders)** (make sure you are logged in!).`;
  }

  if (msg.includes('browse') || msg.includes('shop') || msg.includes('catalog') || msg.includes('teams') || msg.includes('collection') || msg.includes('jerseys') || msg.includes('jersey list')) {
    return `You can browse our collections by team (e.g. Real Madrid, Barcelona, Man United, Arsenal, etc.) on the **[Browse by Teams Page](/teams)**, or explore all jerseys directly on the **[Home Page](/)**!`;
  }

  if (msg.includes('login') || msg.includes('register') || msg.includes('signup') || msg.includes('sign in') || msg.includes('account') || msg.includes('profile') || msg.includes('authorisation') || msg.includes('authorization') || msg.includes('auth')) {
    return `You can sign in, create a new account, or manage your profile on our **[Login / Signup Page](/auth)**.`;
  }

  if (msg.includes('faq') || msg.includes('help') || msg.includes('question')) {
    return `We have compiled answers to common questions about orders, sizing, payments, and shipping on our **[FAQ Page](/faq)**.`;
  }

  if ((msg.includes('privacy') || msg.includes('policy') || msg.includes('data')) && !msg.includes('return') && !msg.includes('refund')) {
    return `You can view details about how we protect your personal information on the **[Privacy Policy Page](/privacy)**.`;
  }

  if (msg.includes('terms') || msg.includes('condition') || msg.includes('rule')) {
    return `You can read our formal terms of service on the **[Terms & Conditions Page](/terms)**.`;
  }

  // 4. Generic tracking query (where is my order, etc.)
  if (msg.includes('where') || msg.includes('track') || msg.includes('order') || msg.includes('status') || msg.includes('delivery') || msg.includes('shipped') || msg.includes('dispatch')) {
    return `To check your shipment status, please share your **Order ID** (found in the invoice email sent to you — starts with \`pay_\`, \`order_\`, or \`COD-\`).\n\n` +
           `Once you provide the Order ID, I'll instantly fetch your order status. If it has been shipped, I will share the **Delhivery tracking link** so you can track it live.\n\n` +
           `You can also track directly on our **[Order Tracking Page](/tracking)** or visit the **[Delhivery tracking website](https://www.delhivery.com/track/package/)**.`;
  }

  // 5. If a jersey search was executed and we have matching/empty results (Fallback check)
  if (matchedJerseys !== null) {
    if (matchedJerseys.length > 0) {
      const list = matchedJerseys
        .map((j: any) => `- **${j.name}** (${j.type === 'player' ? 'Player Version' : 'Fan Version'}) — ₹${j.price} [In Stock]`)
        .join('\n');
      return `Yes! I found these available jerseys matching your request:\n\n${list}\n\n` +
             ` You can click **[here](/)** to view them on our homepage, select your size, and add them to your cart!`;
    } else if (searchTerms && searchTerms.length > 0) {
      return `I couldn't find any specific jerseys matching "${searchTerms.join(', ')}" in our active inventory right now. \n\nWe regularly update our collection with new club, country, and World Cup jerseys! Feel free to browse our full list of club and country teams on the **[Browse by Teams Page](/teams)** or check the **[Home Page](/)** for featured drops.`;
    }
  }

  // 6. Default Fallback Directory
  return `Hello! I am the JerseyVault Customer Support Bot. ⚽\n\n` +
         `How can I help you navigate the store today?\n\n` +
         `🧭 **Store Directory:**\n` +
         `- 🛍️ **[Catalog / Home Page](/)** — Explore all jerseys\n` +
         `- 🏆 **[Browse by Teams](/teams)** — Browse jerseys by league or club\n` +
         `- 🛒 **[Shopping Cart](/cart)** — Open the cart sidebar from the Home Page header\n` +
         `- 💳 **[Checkout Page](/checkout)** — Place your order and complete payment\n` +
         `- 🚚 **[Track Your Order](/tracking)** — Real-time delivery status\n` +
         `- 👤 **[Login / Your Account](/auth)** — Sign in or create an account\n` +
         `- 📦 **[My Orders](/myorders)** — Past receipts & orders\n` +
         `- ❓ **[FAQ Page](/faq)** — Size charts, returns, payments & shipping rules\n` +
         `- 📞 **[Contact Support](/contact)** — Get WhatsApp or Instagram help\n\n` +
         `*Just ask me any question or paste your Order ID/Tracking ID to begin!*`;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Block requests from non-whitelisted origins
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403
    })
  }

  try {
    const { message } = await req.json()

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Initialize Supabase Client using env keys natively available in Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Check for Order ID / Tracking ID
    const orderId = extractOrderOrTrackingId(message)
    let orderDetails = null;

    if (orderId) {
      orderDetails = await fetchOrderDetails(supabaseClient, orderId)
    }

    // 2. Check for jersey availability queries
    let matchedJerseys = null;
    const searchTerms = extractJerseySearchTerms(message);
    const isInventoryQuery = message.toLowerCase().includes('available') || 
                             message.toLowerCase().includes('stock') || 
                             message.toLowerCase().includes('have') || 
                             message.toLowerCase().includes('sell') || 
                             message.toLowerCase().includes('buy') || 
                             message.toLowerCase().includes('get') ||
                             message.toLowerCase().includes('jersey') || 
                             message.toLowerCase().includes('jerseys');

    if (isInventoryQuery && searchTerms.length > 0 && !orderId) {
      matchedJerseys = await findAvailableJerseys(supabaseClient, searchTerms);
    }

    // 3. Compute local response
    const responseText = getLocalResponse(message, orderDetails, matchedJerseys, searchTerms)

    return new Response(JSON.stringify({ text: responseText, orderData: orderDetails }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
