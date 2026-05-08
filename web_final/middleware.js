import { NextResponse } from 'next/server';

const WAF_URL = process.env.WAF_URL || "https://firewall-o5y1.onrender.com";

export async function middleware(request) {
  let payloadToCheck = request.nextUrl.search;

  if (request.method === 'POST') {
    try {
      const clonedReq = request.clone();
      const bodyText  = await clonedReq.text();
      payloadToCheck += ' ' + bodyText;
    } catch (e) {
      console.error('Could not read request body', e);
    }
  }

  if (!payloadToCheck || payloadToCheck.trim() === '') {
    return NextResponse.next();
  }

  try {
    const wafResponse = await fetch(`${WAF_URL}/api/waf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: payloadToCheck, source: 'middleware' })
    });

    const wafData = await wafResponse.json();

    if (wafData.block === true) {
      return new NextResponse(
        JSON.stringify({
          status: 'Blocked by AI Firewall',
          attack_type: wafData.attack_type,
          confidence: wafData.confidence,
          explanation: wafData.explanation
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('WAF API is unreachable:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
