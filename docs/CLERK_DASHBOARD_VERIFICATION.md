# Clerk Dashboard Verification Checklist

## Required Clerk Dashboard Settings

Please verify the following settings in your Clerk Dashboard (https://dashboard.clerk.com):

### 1. Sign-Up Mode and Allow List Configuration (CRITICAL)
- Navigate to: **Your Application → Restrictions → Overview**
- **Sign-up mode** MUST be set to **"Public"** (NOT "Restricted")
- **Important**: In Clerk, "Restricted" mode completely disables the allowlist feature. To use an allowlist to restrict by email domain, you must use "Public" mode.
- Navigate to: **Your Application → Restrictions → Allowlist** tab
- **Enable the allowlist** by toggling the "Enable allowlist" switch (it should now be enabled)
- Add **@providertrust.com** (or *@providertrust.com) to the allowed email domains list in the "Identifiers" section
- Verify the domain appears in the list (you should see it as a chip/badge)
- **Note**: With "Public" mode + allowlist enabled, only users with @providertrust.com email addresses can sign up, effectively restricting access while using the allowlist feature
- Optionally, enable "Apply allowlist and blocklist to sign-ins" in the Overview tab if you want restrictions to apply to sign-ins as well

### 3. Development URLs
- Navigate to: **Your Application → Paths**
- Verify **Fallback development host** is set to: `http://localhost:3000`
- Check that `localhost:3000` is configured in allowed origins/URLs
- Navigate to: **Your Application → Domains**
- Ensure development domain is properly configured

### 4. Google OAuth Configuration
- Navigate to: **Your Application → SSO Connections**
- Ensure **Google** is enabled and configured correctly
- Verify OAuth credentials are set up properly
- Check that the redirect URLs include `http://localhost:3000`

### 5. Component Paths
- Navigate to: **Your Application → Paths**
- Sign-in: Should be set to **Account Portal** (current setting - OK)
- Sign-up: Should be set to **Account Portal** (current setting - OK)

## Environment Variables Verification

Your `.env.local` file has been verified and contains:
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
- ✅ `CLERK_SECRET_KEY` (starts with `sk_test_`)
- ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (points to your Clerk instance)

## Next Steps After Verification

1. Visit Clerk Dashboard in the same browser you're using for development
2. Clear browser cookies for:
   - `localhost:3000`
   - `*.accounts.dev` (Clerk domain)
   - `dashboard.clerk.com`
3. Restart your development server
4. Try authentication again

