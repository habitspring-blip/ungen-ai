export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'  // ✅ CORRECT

interface WeeklySummary {
  createdAt: Date | null;
  metrics: any;
}


export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);

    const summaries = await prisma.summary.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        metrics: true,
      },
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const daySummaries = summaries.filter((s: WeeklySummary) => {
        if (!s.createdAt) return false;
        const summaryDate = new Date(s.createdAt);
        return summaryDate >= date && summaryDate < nextDate;
      });

      const totalWords = daySummaries.reduce((sum: number, s: WeeklySummary) => sum + (s.metrics?.wordCount || 0), 0);

      weeklyData.push({
        day: dayNames[date.getDay()],
        words: totalWords,
      });
    }

    return NextResponse.json(weeklyData);
  } catch (error) {
    console.error('Weekly API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly data' },
      { status: 500 }
    );
  }
}