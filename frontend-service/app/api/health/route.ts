import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'frontend-service',
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'frontend-service',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
