export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const recentRewrites = await prisma.rewrite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        wordCount: true,
        modelType: true,
        createdAt: true,
      },
    });

    const activity = recentRewrites.map(r => ({
      title: r.title || 'Untitled rewrite',
      time: formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }),
      words: r.wordCount,
      model: formatModelName(r.modelType),
    }));

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