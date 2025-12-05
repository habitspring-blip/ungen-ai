import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

// Health check endpoint for production monitoring
export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'unknown',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
      }
    }
  };

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.checks.database = 'connected';
  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.database = 'disconnected';
    console.error('Database health check failed:', error);
  }

  // Set appropriate HTTP status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}

// Detailed health check for comprehensive monitoring
export async function POST() {
  const detailedCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      anthropic: 'unknown',
      cloudflare: 'unknown'
    },
    performance: {
      responseTime: Date.now()
    }
  };

  // Check all critical services
  const checks = await Promise.allSettled([
    // Database check
    prisma.$queryRaw`SELECT 1`,
    
    // API keys validation (lightweight check)
    Promise.resolve(process.env.ANTHROPIC_API_KEY ? 'present' : 'missing'),
    Promise.resolve(process.env.CLOUDFLARE_API_KEY ? 'present' : 'missing'),
  ]);

  // Process results
  detailedCheck.services.database = checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy';
  detailedCheck.services.anthropic = checks[1].status === 'fulfilled' && checks[1].value === 'present' ? 'configured' : 'missing';
  detailedCheck.services.cloudflare = checks[2].status === 'fulfilled' && checks[2].value === 'present' ? 'configured' : 'missing';

  // Overall health status
  if (detailedCheck.services.database === 'unhealthy') {
    detailedCheck.status = 'unhealthy';
  }

  detailedCheck.performance.responseTime = Date.now() - detailedCheck.performance.responseTime;

  const statusCode = detailedCheck.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(detailedCheck, { status: statusCode });
}