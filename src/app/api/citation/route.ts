import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Citation style templates
const citationStyles = {
  apa: {
    template: (data: any) => {
      const authors = data.authors?.map((author: string) => {
        const parts = author.split(',');
        return parts.length > 1 ? `${parts[1].trim()} ${parts[0].trim()}` : author;
      }).join(', ');

      return `${authors} (${data.year}). ${data.title}. ${data.publisher || 'Publisher'}.`;
    },
    inText: (data: any) => {
      const firstAuthor = data.authors?.[0]?.split(',')[0] || 'Author';
      return `(${firstAuthor}, ${data.year})`;
    }
  },
  mla: {
    template: (data: any) => {
      const authors = data.authors?.map((author: string) => {
        const parts = author.split(',');
        return parts.length > 1 ? `${parts[1].trim()} ${parts[0].trim()}` : author;
      }).join(', ');

      return `${authors}. "${data.title}." ${data.publisher || 'Publisher'}, ${data.year}.`;
    },
    inText: (data: any) => {
      const firstAuthor = data.authors?.[0]?.split(',')[0] || 'Author';
      return `(${firstAuthor} ${data.year})`;
    }
  },
  chicago: {
    template: (data: any) => {
      const authors = data.authors?.map((author: string) => {
        const parts = author.split(',');
        return parts.length > 1 ? `${parts[1].trim()} ${parts[0].trim()}` : author;
      }).join(', ');

      return `${authors}. "${data.title}." ${data.publisher || 'Publisher'}, ${data.year}.`;
    },
    inText: (data: any) => {
      const firstAuthor = data.authors?.[0]?.split(',')[0] || 'Author';
      return `(${firstAuthor} ${data.year})`;
    }
  },
  harvard: {
    template: (data: any) => {
      const authors = data.authors?.map((author: string) => {
        const parts = author.split(',');
        return parts.length > 1 ? `${parts[1].trim()} ${parts[0].trim()}` : author;
      }).join(', ');

      return `${authors} (${data.year}) ${data.title}. ${data.publisher || 'Publisher'}.`;
    },
    inText: (data: any) => {
      const firstAuthor = data.authors?.[0]?.split(',')[0] || 'Author';
      return `(${firstAuthor}, ${data.year})`;
    }
  },
  ieee: {
    template: (data: any) => {
      const authors = data.authors?.map((author: string, index: number) => {
        const parts = author.split(',');
        const formatted = parts.length > 1 ? `${parts[1].trim()[0]}. ${parts[0].trim()}` : author;
        return index === data.authors.length - 1 && data.authors.length > 1 ? `and ${formatted}` : formatted;
      }).join(', ');

      return `[1] ${authors}, "${data.title}," ${data.publisher || 'Publisher'}, ${data.year}.`;
    },
    inText: (data: any) => '[1]'
  },
  ama: {
    template: (data: any) => {
      const authors = data.authors?.map((author: string, index: number) => {
        const parts = author.split(',');
        const formatted = parts.length > 1 ? `${parts[1].trim()} ${parts[0].trim()}` : author;
        return index === data.authors.length - 1 && data.authors.length > 1 ? `& ${formatted}` : formatted;
      }).join(', ');

      return `${authors}. ${data.title}. ${data.publisher || 'Publisher'}; ${data.year}.`;
    },
    inText: (data: any) => {
      const firstAuthor = data.authors?.[0]?.split(',')[0] || 'Author';
      return `(${firstAuthor})`;
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, style = 'apa', sourceInfo } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Analyze text for citation needs
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const potentialSources = sentences.map((sentence: string, index: number) => {
      const needsCitation = sentence.toLowerCase().includes('research') ||
                           sentence.toLowerCase().includes('study') ||
                           sentence.toLowerCase().includes('according to') ||
                           sentence.toLowerCase().includes('found that') ||
                           sentence.toLowerCase().includes('data shows');

      return {
        sentence: sentence.trim(),
        index,
        needsCitation,
        reason: needsCitation ? 'Contains research claims or data references' : 'No citation needed'
      };
    });

    const quotesCount = (text.match(/"/g) || []).length / 2;
    const academicTermsCount = (text.match(/\b(research|study|data|analysis|method|results?|findings?|conclusion)\b/gi) || []).length;

    // Generate citation if source info provided
    let citation = '';
    let inTextCitations: any[] = [];

    if (sourceInfo && Object.keys(sourceInfo).length > 0) {
      const styleConfig = citationStyles[style as keyof typeof citationStyles];
      if (styleConfig) {
        citation = styleConfig.template(sourceInfo);

        // Generate in-text citations for sentences that need them
        inTextCitations = potentialSources
          .filter(source => source.needsCitation)
          .slice(0, 3) // Limit to 3 in-text citations
          .map((source, index) => ({
            position: source.index,
            citation: styleConfig.inText(sourceInfo)
          }));
      }
    }

    const result = {
      analysis: {
        totalSentences: sentences.length,
        potentialSources,
        quotesCount,
        academicTermsCount
      },
      citation,
      inTextCitations,
      style,
      formattedText: text // Could add formatting here
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Citation generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}