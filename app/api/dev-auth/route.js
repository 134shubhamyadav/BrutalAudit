import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL;
    const ADMIN_PASS = process.env.DEV_ADMIN_PASS;

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      // Env vars not set yet — tell the developer clearly
      return NextResponse.json(
        { error: 'Admin credentials not configured in environment variables. Add DEV_ADMIN_EMAIL and DEV_ADMIN_PASS to your .env.local.' },
        { status: 503 }
      );
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      // Generic error — don't reveal which field is wrong
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Return a simple session token (not stored, just checked via sessionStorage on client)
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
