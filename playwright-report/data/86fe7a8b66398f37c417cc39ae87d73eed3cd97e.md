# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracking.spec.js >> Tracking Page >> tracking page loads without runtime errors
- Location: tests\tracking.spec.js:15:3

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
      - link "JerseyVault logo JERSEY VAULT" [ref=e6] [cursor=pointer]:
        - /url: /
        - generic [ref=e7]:
          - img "JerseyVault logo" [ref=e8]
          - generic [ref=e9]:
            - text: JERSEY
            - generic [ref=e10]: VAULT
      - generic [ref=e11]:
        - link "HOME" [ref=e12] [cursor=pointer]:
          - /url: /
        - link "MY ORDERS" [ref=e13] [cursor=pointer]:
          - /url: /myorders
      - generic [ref=e14]: TRACKING
    - generic [ref=e15]:
      - paragraph [ref=e16]: SHIPMENT STATUS
      - heading "TRACK YOUR ORDER" [level=1] [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]: Order ID
        - textbox "Order ID" [ref=e20]:
          - /placeholder: ENTER ORDER ID
        - button "TRACK →" [ref=e21] [cursor=pointer]
```