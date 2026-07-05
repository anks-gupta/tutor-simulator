import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from './rate-limit';
import { HITESH_RATE_LIMIT_MSG, PIYUSH_RATE_LIMIT_MSG, DEBATE_RATE_LIMIT_MSG } from '../constants/tutor';

export interface RateLimitOptions {
  limitEnvVar: string;
  defaultLimit: number;
  isDebate?: boolean;
}

/**
 * Reusable Higher-Order Route Decorator to enforce IP rate limiting on Next.js App Router handlers
 */
export function withRateLimit(
  handler: (req: NextRequest, body: any) => Promise<NextResponse>,
  options: RateLimitOptions
) {
  return async (req: NextRequest) => {
    // Resolve client IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
      }
    }

    // Load rate limit config from environment variables
    const limit = parseInt(process.env[options.limitEnvVar] || String(options.defaultLimit), 10);
    const rateLimitResult = isRateLimited(ip, limit, 60000);

    // If rate-limited, return 429 immediately with appropriate headers
    if (!rateLimitResult.success) {
      let errorMsg = DEBATE_RATE_LIMIT_MSG;
      if (!options.isDebate) {
        errorMsg = body.tutor === 'piyush' ? PIYUSH_RATE_LIMIT_MSG : HITESH_RATE_LIMIT_MSG;
      }

      return NextResponse.json(
        { error: errorMsg },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
    }

    // Delegate execution to the route handler
    const response = await handler(req, body);

    // Automatically append rate limit status headers to the success response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    return response;
  };
}
