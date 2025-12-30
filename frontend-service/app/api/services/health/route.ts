import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:8080';
    const userUrl = process.env.USER_SERVICE_URL || 'http://localhost:8081';
    const commentUrl = process.env.COMMENT_SERVICE_URL || 'http://localhost:8082';

    const services = {
      catalog: { url: catalogUrl, status: 'UNKNOWN' },
      user: { url: userUrl, status: 'UNKNOWN' },
      comment: { url: commentUrl, status: 'UNKNOWN' },
    };

    // Check catalog service
    try {
      const catalogResponse = await fetch(`${catalogUrl}/actuator/health`, {
        signal: AbortSignal.timeout(5000),
      });
      services.catalog.status = catalogResponse.ok ? 'UP' : 'DOWN';
    } catch {
      services.catalog.status = 'DOWN';
    }

    // Check user service
    try {
      const userResponse = await fetch(`${userUrl}/actuator/health`, {
        signal: AbortSignal.timeout(5000),
      });
      services.user.status = userResponse.ok ? 'UP' : 'DOWN';
    } catch {
      services.user.status = 'DOWN';
    }

    // Check comment service
    try {
      const commentResponse = await fetch(`${commentUrl}/actuator/health`, {
        signal: AbortSignal.timeout(5000),
      });
      services.comment.status = commentResponse.ok ? 'UP' : 'DOWN';
    } catch {
      services.comment.status = 'DOWN';
    }

    const allUp = Object.values(services).every(s => s.status === 'UP');

    return NextResponse.json(
      {
        status: allUp ? 'UP' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        services,
      },
      { status: allUp ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
