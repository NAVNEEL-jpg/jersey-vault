# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication Flows (UI Only) >> auth page loads and allows switching between modes without crashing
- Location: tests\auth.spec.js:15:3

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
      - generic [ref=e11]: YOUR ACCOUNT
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e17] [cursor=pointer]:
          - img "JerseyVault logo" [ref=e18]
          - generic [ref=e19]:
            - text: JERSEY
            - generic [ref=e20]: VAULT
        - heading "CREATE ACCOUNT" [level=1] [ref=e21]
        - paragraph [ref=e22]: Join JerseyVault — it's free
      - generic [ref=e23]:
        - button "LOGIN" [ref=e24] [cursor=pointer]
        - button "SIGN UP" [active] [ref=e25] [cursor=pointer]
      - button "CONTINUE WITH GOOGLE" [ref=e26] [cursor=pointer]:
        - img [ref=e27]
        - text: CONTINUE WITH GOOGLE
      - generic [ref=e34]: OR
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]: FULL NAME
          - textbox "FULL NAME" [ref=e40]:
            - /placeholder: Neel Kumar
        - generic [ref=e41]:
          - generic [ref=e42]: EMAIL ADDRESS
          - textbox "EMAIL ADDRESS" [ref=e44]:
            - /placeholder: you@email.com
        - generic [ref=e45]:
          - generic [ref=e46]: PHONE NUMBER
          - generic [ref=e47]:
            - combobox "Country code" [ref=e48]:
              - option "IN +91" [selected]
              - option "US +1"
              - option "UK +44"
              - option "UAE +971"
              - option "AU +61"
              - option "CA +1"
              - option "DE +49"
              - option "FR +33"
              - option "JP +81"
              - option "SG +65"
            - textbox "PHONE NUMBER" [ref=e49]:
              - /placeholder: "9876543210"
        - generic [ref=e50]:
          - generic [ref=e51]: PASSWORD
          - generic [ref=e52]:
            - textbox "PASSWORD" [ref=e53]:
              - /placeholder: Min. 6 characters
            - button "👁️" [ref=e54] [cursor=pointer]
        - generic [ref=e55]:
          - generic [ref=e56]: CONFIRM PASSWORD
          - generic [ref=e57]:
            - textbox "CONFIRM PASSWORD" [ref=e58]:
              - /placeholder: Re-enter password
            - button "👁️" [ref=e59] [cursor=pointer]
      - button "CREATE ACCOUNT →" [ref=e60] [cursor=pointer]
      - paragraph [ref=e61]:
        - text: By signing up you agree to our
        - link "Terms of Service" [ref=e62] [cursor=pointer]:
          - /url: /terms
        - text: and
        - link "Privacy Policy" [ref=e63] [cursor=pointer]:
          - /url: /privacy
      - paragraph [ref=e64]:
        - text: Already have an account?
        - button "LOGIN" [ref=e65] [cursor=pointer]
```