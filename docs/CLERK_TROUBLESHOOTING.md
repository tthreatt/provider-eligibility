# Clerk Authentication Troubleshooting Guide

## Current Issue
`dev_browser_unauthenticated` error persists after re-enabling allow list with @providertrust.com

## Required Clerk Dashboard Configuration

### 1. Sign-Up Mode and Allow List Configuration (CRITICAL)
- Navigate to: Clerk Dashboard → Your Application → Restrictions → Overview
- **Sign-up mode** MUST be set to **"Public"** (NOT "Restricted")
- **Important**: In Clerk, "Restricted" mode completely disables the allowlist feature. Restricted mode only allows:
  - Users invited by admins
  - Users manually created by admins
  - Users authenticated through enterprise SSO connections
- To restrict sign-ups by email domain using an allowlist, you must use "Public" mode
- Navigate to: **Allowlist** tab
- **Enable the allowlist** by toggling the "Enable allowlist" switch
- Add **@providertrust.com** (or *@providertrust.com) to the allowed email domains list in the "Identifiers" section
- Verify the domain appears in the list (you should see it as a chip/badge)
- **Note**: With "Public" mode + allowlist enabled, only users with @providertrust.com email addresses can sign up, effectively restricting access while using the allowlist feature
- Optionally, in the Overview tab, enable "Apply allowlist and blocklist to sign-ins" if you want restrictions to apply to sign-ins as well

### 3. Development URLs
- Verify **Fallback development host** is set to: `http://localhost:3000`
- Check that localhost:3000 is configured in allowed origins/URLs

### 4. Component Paths (Current Setup)
- Sign-in: Account Portal (current setting - OK)
- Sign-up: Account Portal (current setting - OK)
- These settings are correct for your current setup

## Required Environment Variables

Verify these are set in your `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://your-instance.accounts.dev/sign-in
```

**Important**: 
- Ensure these match your **development instance** (not production)
- The publishable key should start with `pk_test_` for development
- The secret key should start with `sk_test_` for development

## Browser Authentication Steps

1. **Visit Clerk Dashboard First**
   - Open Clerk Dashboard (https://dashboard.clerk.com) in the same browser
   - This authenticates your browser with Clerk's development instance
   - Stay logged into the dashboard

2. **Clear Browser State**
   - Clear all cookies for:
     - `localhost:3000`
     - `*.accounts.dev` (Clerk domain)
     - `dashboard.clerk.com`
   - Or use incognito/private window

3. **Restart Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test Authentication**
   - Try signing in with a @providertrust.com Google account
   - Check browser console for any additional errors

## Additional Troubleshooting

### If Still Not Working:

1. **Verify Google OAuth is Configured**
   - Clerk Dashboard → SSO Connections
   - Ensure Google is enabled and configured correctly

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for any Clerk-related errors
   - Check Network tab for failed requests

3. **Try Different Browser**
   - Test in Chrome, Firefox, or Safari
   - Rule out browser-specific issues

4. **Verify No Browser Extensions Interfering**
   - Disable ad blockers
   - Disable privacy extensions temporarily
   - Test in incognito mode

5. **Contact Clerk Support**
   - If issue persists, contact support@clerk.com
   - Provide error code: `dev_browser_unauthenticated`
   - Include trace ID from error response

## Verification Checklist

- [ ] Sign-up mode is set to "Public" (required to use allowlist feature)
- [ ] Allowlist is enabled in the Allowlist tab
- [ ] @providertrust.com is in allowed domains list
- [ ] Development host is set to localhost:3000
- [ ] Environment variables are set correctly
- [ ] Environment variables match development instance
- [ ] Visited Clerk dashboard to authenticate browser
- [ ] Cleared browser cookies
- [ ] Restarted development server
- [ ] Google OAuth is configured in Clerk

