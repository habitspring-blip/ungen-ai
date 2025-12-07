export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'  // ✅ CORRECT




export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const modelCounts = await prisma.summary.groupBy({
      by: ['modelVersion'],
      where: { userId },
      _count: { id: true },
    });

    const totalCount = modelCounts.reduce((sum, m) => sum + m._count.id, 0);

    if (totalCount === 0) {
      return NextResponse.json([]);
    }

    const modelUsage = modelCounts.map(m => ({
      name: formatModelName(m.modelVersion || 'unknown'),
      percentage: Math.round((m._count.id / totalCount) * 100),
    }));

    return NextResponse.json(modelUsage);
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model usage' },
      { status: 500 }
    );
  }
}

function formatModelName(modelType: string): string {
  const mapping: Record<string, string> = {
    'auto': 'Auto',
    'claude': 'Claude',
    'gpt4': 'GPT-4',
    'cloudflare': 'Cloudflare',
  };
  return mapping[modelType.toLowerCase()] || modelType;
}