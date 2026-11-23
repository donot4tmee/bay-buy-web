# Baybay Basket Web

The web client currently provides public verified-store and product discovery
against the API's public routes. Set `VITE_API_BASE_URL` before running it
against a deployed API; development defaults to `http://localhost:3000`.

```text
npm install
npm run build
```

Authentication, basket submission, and business management should use the
server API rather than duplicating authorization in the browser.
