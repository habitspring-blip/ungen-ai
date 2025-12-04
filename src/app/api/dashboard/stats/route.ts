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
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyUsage = await prisma.rewrite.aggregate({
      where: {
        userId,
        createdAt: { gte: firstDayOfMonth },
      },
      _sum: { wordCount: true },
    });

    const totalRewrites = await prisma.rewrite.count({
      where: { userId },
    });

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return NextResponse.json({
      wordsUsed: monthlyUsage._sum.wordCount || 0,
      totalRewrites,
      remainingCredits: userRecord?.credits || 0,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}