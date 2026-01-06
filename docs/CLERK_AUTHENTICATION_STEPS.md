# Steps to Fix dev_browser_unauthenticated Error

## Summary
The `dev_browser_unauthenticated` error occurs when your browser cannot authenticate with Clerk's development instance. This is typically a browser/Dashboard configuration issue, not a code issue.

## Step-by-Step Fix

### Step 1: Verify Clerk Dashboard Settings
Follow the checklist in `CLERK_DASHBOARD_VERIFICATION.md` to ensure:
- Sign-up mode is set to **"Public"** (in Restrictions → Overview tab)
  - **Important**: "Restricted" mode disables allowlists. To restrict by email domain, use "Public" mode with allowlist enabled
- Navigate to **Allowlist** tab and **enable the allowlist** toggle
- **@providertrust.com** is added to the allowlist (in Restrictions → Allowlist tab)
- Development host is set to http://localhost:3000
- Google OAuth is configured

### Step 2: Authenticate Browser with Clerk Dashboard (CRITICAL)
1. **Open Clerk Dashboard** in the SAME browser you use for development:
   - Go to https://dashboard.clerk.com
   - **Log in to your Clerk account** (this is essential - it authenticates your browser)
   - Navigate to your application (model-cheetah-38)
   - **Keep the dashboard open** while testing
   - **This step is REQUIRED** - your browser must be authenticated with Clerk's development instance

### Step 3: Clear ALL Clerk-Related Cookies
**Important**: You must clear cookies for ALL Clerk domains, not just the page:

Clear cookies for these domains:
- `localhost:3000`
- `model-cheetah-38.clerk.accounts.dev` (your specific instance)
- `*.clerk.accounts.dev` (all Clerk accounts.dev subdomains)
- `dashboard.clerk.com`
- `clerk.com`

**Best Method**: Use DevTools → Application tab → Cookies, and delete cookies for each domain listed above

**How to clear cookies:**
- Chrome/Edge: Settings → Privacy → Clear browsing data → Cookies
- Firefox: Settings → Privacy → Cookies and Site Data → Clear Data
- Safari: Preferences → Privacy → Manage Website Data

**Or use Developer Tools:**
1. Open DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Click "Cookies" in the left sidebar
4. Delete cookies for the domains listed above

**Alternative:** Use an incognito/private window for testing

### Step 4: Restart Development Server
```bash
cd frontend
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 5: Test Authentication
1. Navigate to `http://localhost:3000`
2. Click "Continue with Google"
3. Sign in with a @providertrust.com Google account
4. Check browser console (F12) for any errors

## If Still Not Working

### Enable Clerk Debugger
Add this to your browser console or URL:
```javascript
// In browser console:
Clerk("debug");

// Or add to URL:
#clerkjs:debug.level=all&debug.enable=true
```

### Check Network Requests
1. Open DevTools → Network tab
2. Try to sign in
3. Look for failed requests to Clerk APIs
4. Check error messages and status codes

### Verify Environment Variables
Ensure `.env.local` contains (already verified):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
- `CLERK_SECRET_KEY=sk_test_...`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://model-cheetah-38.clerk.accounts.dev/sign-in`

### Try Different Browser
Test in Chrome, Firefox, or Safari to rule out browser-specific issues.

### Disable Browser Extensions
Temporarily disable:
- Ad blockers
- Privacy extensions
- Cookie blockers
- VPN extensions

### Contact Clerk Support
If issue persists:
- Email: support@clerk.com
- Include error code: `dev_browser_unauthenticated`
- Include trace ID from error response
- Describe steps you've taken

## Expected Behavior After Fix
- You should be able to click "Continue with Google"
- You should be redirected to Google OAuth
- After signing in with @providertrust.com account, you should be redirected back
- You should see the UserButton in the header when signed in

