import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use the base Clerk domain instead of the sign-in URL
    const clerkDomain = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.replace('/sign-in', '');
    if (!clerkDomain) {
      throw new Error('Missing or invalid CLERK domain');
    }

    // Construct the OAuth start URL
    const googleOAuthUrl = `${clerkDomain}/v2/oauth/google/start?redirect_url=${encodeURIComponent('http://localhost:3000')}`;
    return NextResponse.redirect(googleOAuthUrl);
  } catch (error) {
    console.error('OAuth redirect error:', error);
    // Return a JSON response for errors instead of redirecting
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 