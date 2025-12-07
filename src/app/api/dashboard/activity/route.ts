export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";  // ✅ Correct
import { formatDistanceToNow } from 'date-fns';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const recentSummaries = await (prisma as any).summary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        summaryText: true,
        metrics: true,
        modelVersion: true,
        createdAt: true,
      },
    });

    const activity = recentSummaries.map(s => {
      const metrics = s.metrics as any;
      return {
        title: `Summary generated`,
        time: formatDistanceToNow(new Date(s.createdAt!), { addSuffix: true }),
        words: metrics?.wordCount || 0,
        model: formatModelName(s.modelVersion || 'unknown'),
      };
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
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