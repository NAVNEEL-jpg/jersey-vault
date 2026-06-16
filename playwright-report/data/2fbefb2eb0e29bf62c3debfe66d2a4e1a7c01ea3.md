# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.js >> Homepage >> loads homepage and renders products without errors
- Location: tests\homepage.spec.js:15:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - navigation [ref=e5]:
      - generic [ref=e6] [cursor=pointer]:
        - img "JerseyVault logo" [ref=e7]
        - generic [ref=e8]:
          - text: JERSEY
          - generic [ref=e9]: VAULT
      - textbox "Search jerseys" [ref=e12]:
        - /placeholder: SEARCH JERSEYS...
      - generic [ref=e13]:
        - link "HOME" [ref=e14] [cursor=pointer]:
          - /url: /
        - button "SHOP" [ref=e15] [cursor=pointer]
        - link "TEAMS" [ref=e16] [cursor=pointer]:
          - /url: /teams
        - link "TRACK" [ref=e17] [cursor=pointer]:
          - /url: /tracking
        - button "CART" [ref=e18] [cursor=pointer]
        - link "MY ORDERS" [ref=e19] [cursor=pointer]:
          - /url: /myorders
        - link "LOGIN" [ref=e20] [cursor=pointer]:
          - /url: /auth
      - button "Open cart" [ref=e23] [cursor=pointer]:
        - img [ref=e24]
    - generic [ref=e29]:
      - generic [ref=e30]:
        - generic [ref=e31]: ★ FREE SHIPPING ABOVE ₹1999
        - generic [ref=e32]: ★ AUTHENTIC LICENSED JERSEYS
        - generic [ref=e33]: ★ EASY 30-DAY RETURNS
        - generic [ref=e34]: ★ COD AVAILABLE
        - generic [ref=e35]: ★ SIZES XS TO XXL
      - generic [ref=e36]:
        - generic [ref=e37]: ★ FREE SHIPPING ABOVE ₹1999
        - generic [ref=e38]: ★ AUTHENTIC LICENSED JERSEYS
        - generic [ref=e39]: ★ EASY 30-DAY RETURNS
        - generic [ref=e40]: ★ COD AVAILABLE
        - generic [ref=e41]: ★ SIZES XS TO XXL
    - generic [ref=e65]:
      - paragraph [ref=e66]: THE ULTIMATE COLLECTION
      - heading "WEAR YOUR LEGEND" [level=1] [ref=e67]:
        - generic [ref=e69]:
          - generic [ref=e70]: WEAR YOUR
          - img
        - generic [ref=e71]: LEGEND
      - paragraph [ref=e72]: Official jerseys from football, cricket & basketball
      - generic [ref=e73]:
        - button "SHOP NOW" [ref=e74] [cursor=pointer]
        - button "VIEW TEAMS" [ref=e75] [cursor=pointer]
    - generic [ref=e77]:
      - generic [ref=e78]:
        - generic [ref=e79]: 100+
        - generic [ref=e80]: JERSEYS
      - generic [ref=e81]:
        - generic [ref=e82]: 5K+
        - generic [ref=e83]: CUSTOMERS
      - generic [ref=e84]:
        - generic [ref=e85]: 100%
        - generic [ref=e86]: AUTHENTIC
    - generic [ref=e89]:
      - heading "/ SHOP ALL" [level=2] [ref=e90]
      - generic [ref=e91]:
        - button "ALL" [ref=e92]:
          - generic [ref=e93]: ALL
        - button "FAN VERSION" [ref=e94]:
          - generic [ref=e95]: FAN VERSION
        - button "PLAYER VERSION" [ref=e96]:
          - generic [ref=e97]: PLAYER VERSION
        - button "WC 26" [ref=e98]:
          - generic [ref=e99]: WC 26
        - button "RETRO" [ref=e100]:
          - generic [ref=e101]: RETRO
    - generic [ref=e124]:
      - heading "WHY JERSEYVAULT" [level=2] [ref=e125]
      - generic [ref=e126]:
        - generic [ref=e127]:
          - generic [ref=e128]: 🏅
          - generic [ref=e129]: LICENSED AUTHENTIC
          - generic [ref=e130]: Every jersey is officially licensed and verified
        - generic [ref=e131]:
          - generic [ref=e132]: 🚚
          - generic [ref=e133]: FAST DELIVERY
          - generic [ref=e134]: Ships within 24–48 hours across India
        - generic [ref=e135]:
          - generic [ref=e136]: ↩️
          - generic [ref=e137]: 30-DAY RETURNS
          - generic [ref=e138]: No questions asked easy returns
        - generic [ref=e139]:
          - generic [ref=e140]: 🔒
          - generic [ref=e141]: SECURE PAYMENTS
          - generic [ref=e142]: Razorpay — UPI, Cards, Netbanking
    - contentinfo [ref=e144]:
      - generic [ref=e145]: JERSEYVAULT
      - paragraph [ref=e146]: © 2026 JERSEYVAULT. ALL RIGHTS RESERVED.
      - generic [ref=e147]:
        - link "PRIVACY" [ref=e148] [cursor=pointer]:
          - /url: /privacy
        - link "TERMS" [ref=e149] [cursor=pointer]:
          - /url: /terms
        - link "CONTACT" [ref=e150] [cursor=pointer]:
          - /url: /contact
        - link "FAQ" [ref=e151] [cursor=pointer]:
          - /url: /faq
  - generic [ref=e153]:
    - button "✕" [ref=e154] [cursor=pointer]
    - link "SHOP WORLD CUP KITS NOW" [ref=e155] [cursor=pointer]:
      - /url: /?featured=true
      - img "SHOP WORLD CUP KITS NOW" [ref=e156]
```