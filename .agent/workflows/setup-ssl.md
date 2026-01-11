---
description: Setup Free SSL Certificate with Certbot
---

# Setup SSL for TestDone.in

Follow these steps to secure your domain with HTTPS.

## Prerequisites
1. Ensure your domain `testdone.in` and `www.testdone.in` A records point to `72.62.145.63`.
2. Ensure deployment is successful (Nginx running on port 80).

## Steps

1. **SSH into VPS**
   ```bash
   ssh ankushmulla@72.62.145.63
   # Password: Ankush1234
   ```

2. **Run Certbot**
   ```bash
   sudo certbot --nginx -d testdone.in -d www.testdone.in
   ```

3. **Follow Prompts**
   - Enter email: `admin@testdone.in`
   - Agree to Terms: `Y`
   - Share email: `N` (optional)
   - Redirect HTTP to HTTPS: Select `2` (Redirect)

4. **Verify SSL**
   Visit https://testdone.in in your browser.

## Auto-Renewal
Certbot automatically sets up a timer for renewal. You can test it:
```bash
sudo certbot renew --dry-run
```
