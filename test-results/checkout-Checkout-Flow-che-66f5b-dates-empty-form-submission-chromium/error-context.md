# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.js >> Checkout Flow >> checkout loads and validates empty form submission
- Location: tests\checkout.spec.js:22:3

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
      - generic [ref=e7] [cursor=pointer]:
        - img "JerseyVault logo" [ref=e8]
        - generic [ref=e9]:
          - text: JERSEY
          - generic [ref=e10]: VAULT
      - generic [ref=e11]: SECURE CHECKOUT 🔒
    - main [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e16]:
            - generic [ref=e17]: "1"
            - generic [ref=e18]: DELIVERY
          - generic [ref=e21]:
            - generic [ref=e22]: "2"
            - generic [ref=e23]: PAYMENT
          - generic [ref=e26]:
            - generic [ref=e27]: "3"
            - generic [ref=e28]: CONFIRM
        - generic [ref=e29]:
          - heading "/ DELIVERY DETAILS" [level=2] [ref=e30]
          - generic [ref=e31]:
            - generic [ref=e32]:
              - text: FULL NAME
              - textbox "FULL NAME" [ref=e33]:
                - /placeholder: Navneel Dutta
            - generic [ref=e34]:
              - text: PHONE NUMBER
              - textbox "PHONE NUMBER" [ref=e35]:
                - /placeholder: "9876543210"
            - generic [ref=e36]:
              - text: EMAIL ADDRESS
              - textbox "EMAIL ADDRESS" [ref=e37]:
                - /placeholder: you@email.com
            - generic [ref=e38]:
              - text: STREET ADDRESS
              - textbox "STREET ADDRESS" [ref=e39]:
                - /placeholder: Flat 4B, Park Street
            - generic [ref=e40]:
              - text: CITY
              - textbox "CITY" [ref=e41]:
                - /placeholder: Kolkata
            - generic [ref=e42]:
              - text: STATE
              - textbox "STATE" [ref=e43]:
                - /placeholder: West Bengal
            - generic [ref=e44]:
              - text: PINCODE
              - textbox "PINCODE" [ref=e45]:
                - /placeholder: "700001"
          - generic [ref=e46]:
            - text: PASSWORD (OPTIONAL)
            - textbox "Create an account password (optional, minimum 6 characters)" [ref=e47]:
              - /placeholder: Create a password (min. 6 chars)
          - paragraph [ref=e48]: 💡 Your email & password will be saved for future logins — no need to re-enter next time.
          - button "CONTINUE TO PAYMENT →" [ref=e49] [cursor=pointer]
```