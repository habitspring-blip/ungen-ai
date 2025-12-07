import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// -------------------------------------------------------
// TYPES
// -------------------------------------------------------
interface SourceInfo {
  title?: string;
  author?: string;
  year?: string;
  publisher?: string;
  url?: string;
  doi?: string;
}

interface PotentialSource {
  sentence: string;
  index: number;
  needsCitation: boolean;
  reason: string;
}

// -------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------
const MAX_TEXT_LENGTH = 5000;

// Citation styles
const CITATION_STYLES = {
  apa: 'APA (7th Edition)',
  mla: 'MLA (9th Edition)',
  chicago: 'Chicago (17th Edition)',
  harvard: 'Harvard',
  ieee: 'IEEE',
  ama: 'AMA'
};

// -------------------------------------------------------
// CITATION ANALYSIS FUNCTIONS
// -------------------------------------------------------
function analyzeCitationNeeds(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);

  // Simple analysis for citation requirements
  const potentialSources: PotentialSource[] = [];
  const academicTerms = ['study', 'research', 'according to', 'researchers', 'scientists', 'study shows', 'data indicates'];
  const quotes = (text.match(/"/g) || []).length;

  sentences.forEach((sentence, index) => {
    const lowerSentence = sentence.toLowerCase();
    const hasAcademicTerm = academicTerms.some(term => lowerSentence.includes(term));
    const hasQuote = lowerSentence.includes('"');

    if (hasAcademicTerm || hasQuote) {
      potentialSources.push({
        sentence: sentence.trim(),
        index,
        needsCitation: true,
        reason: hasQuote ? 'Contains quote' : 'Academic reference'
      });
    }
  });

  return {
    totalSentences: sentences.length,
    potentialSources: potentialSources.slice(0, 10), // Limit to 10
    quotesCount: quotes,
    academicTermsCount: potentialSources.length
  };
}

// -------------------------------------------------------
// CITATION GENERATION FUNCTIONS
// -------------------------------------------------------
function generateCitation(style: string, sourceInfo: SourceInfo): string {
  const { title, author, year, publisher, url, doi } = sourceInfo;

  switch (style.toLowerCase()) {
    case 'apa':
      return generateAPA(title, author, year, publisher, url, doi);
    case 'mla':
      return generateMLA(title, author, year, publisher, url);
    case 'chicago':
      return generateChicago(title, author, year, publisher, url);
    case 'harvard':
      return generateHarvard(title, author, year, publisher, url);
    case 'ieee':
      return generateIEEE(title, author, year, publisher, url);
    case 'ama':
      return generateAMA(title, author, year, publisher, url);
    default:
      return generateAPA(title, author, year, publisher, url, doi);
  }
}

function generateAPA(title?: string, author?: string, year?: string, publisher?: string, url?: string, doi?: string): string {
  let citation = '';

  if (author) citation += `${author}. `;
  if (year) citation += `(${year}). `;
  if (title) citation += `${title}. `;

  if (publisher) citation += `${publisher}.`;
  if (doi) citation += ` https://doi.org/${doi}`;
  else if (url) citation += ` ${url}`;

  return citation;
}

function generateMLA(title?: string, author?: string, year?: string, publisher?: string, url?: string): string {
  let citation = '';

  if (author) citation += `${author}. `;
  if (title) citation += `"${title}." `;
  if (publisher) citation += `${publisher}, `;
  if (year) citation += `${year}`;
  if (url) citation += `, ${url}`;

  return citation + '.';
}

function generateChicago(title?: string, author?: string, year?: string, publisher?: string, url?: string): string {
  let citation = '';

  if (author) citation += `${author}. `;
  if (title) citation += `"${title}." `;
  if (publisher) citation += `${publisher}, `;
  if (year) citation += `${year}.`;
  if (url) citation += ` ${url}`;

  return citation;
}

function generateHarvard(title?: string, author?: string, year?: string, publisher?: string, url?: string): string {
  let citation = '';

  if (author) citation += `${author} `;
  if (year) citation += `(${year}) `;
  if (title) citation += `${title}. `;
  if (publisher) citation += `${publisher}.`;
  if (url) citation += ` Available at: ${url}`;

  return citation;
}

function generateIEEE(title?: string, author?: string, year?: string, publisher?: string, url?: string): string {
  let citation = '';

  if (author) citation += `${author}, `;
  if (title) citation += `"${title}," `;
  if (publisher) citation += `${publisher}, `;
  if (year) citation += `${year}.`;
  if (url) citation += ` [Online]. Available: ${url}`;

  return citation;
}

function generateAMA(title?: string, author?: string, year?: string, publisher?: string, url?: string): string {
  let citation = '';

  if (author) citation += `${author}. `;
  if (title) citation += `${title}. `;
  if (publisher) citation += `${publisher}; `;
  if (year) citation += `${year}.`;
  if (url) citation += ` Accessed ${new Date().toLocaleDateString()}. ${url}`;

  return citation;
}

// -------------------------------------------------------
// MAIN ROUTE HANDLER
// -------------------------------------------------------
export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await req.json();
    const { text, style = 'apa', sourceInfo } = body;

    // Input validation
    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: "Text is required" });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`
      });
    }

    if (!CITATION_STYLES[style as keyof typeof CITATION_STYLES]) {
      return NextResponse.json({
        success: false,
        error: `Invalid citation style. Must be one of: ${Object.keys(CITATION_STYLES).join(', ')}`
      });
    }

    // Analyze text for citation needs
    const analysis = analyzeCitationNeeds(text);

    // Generate citation
    let citation = '';
    if (sourceInfo && Object.keys(sourceInfo).length > 0) {
      citation = generateCitation(style, sourceInfo);
    }

    // Generate in-text citations for the text
    const inTextCitations = generateInTextCitations(text, style, sourceInfo);

    const result = {
      success: true,
      analysis,
      citation,
      inTextCitations,
      style: CITATION_STYLES[style as keyof typeof CITATION_STYLES],
      formattedText: insertCitationsIntoText(text, inTextCitations)
    };

    return NextResponse.json(result);

  } catch (err: unknown) {
    console.error('Citation generation error:', err);
    const errorMessage = err instanceof Error ? err.message : "Citation generation failed";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper functions for in-text citations
function generateInTextCitations(text: string, style: string, sourceInfo: SourceInfo): Array<{ position: number; citation: string }> {
  const citations: Array<{ position: number; citation: string }> = [];
  const sentences = text.split(/[.!?]+/);

  sentences.forEach((sentence, index) => {
    const lowerSentence = sentence.toLowerCase();
    if (lowerSentence.includes('study') || lowerSentence.includes('research') || lowerSentence.includes('according to')) {
      const position = text.indexOf(sentence);
      const citation = generateInTextCitation(style, sourceInfo, index + 1);
      citations.push({ position, citation });
    }
  });

  return citations.slice(0, 5); // Limit to 5 citations
}

function generateInTextCitation(style: string, sourceInfo: SourceInfo, sentenceNumber: number): string {
  const { author, year } = sourceInfo;

  switch (style.toLowerCase()) {
    case 'apa':
      return author ? `(${author.split(' ')[0]}, ${year})` : `(${year})`;
    case 'mla':
      return author ? `(${author.split(' ')[0]} ${sentenceNumber})` : `(${sentenceNumber})`;
    case 'chicago':
      return author ? `(${author.split(' ')[0]} ${year})` : `(${year})`;
    case 'harvard':
      return author ? `(${author.split(' ')[0]}, ${year})` : `(${year})`;
    case 'ieee':
      return `[${sentenceNumber}]`;
    case 'ama':
      return `^${sentenceNumber}^`;
    default:
      return author ? `(${author.split(' ')[0]}, ${year})` : `(${year})`;
  }
}

function insertCitationsIntoText(text: string, citations: Array<{ position: number; citation: string }>): string {
  let result = text;
  let offset = 0;

  citations.forEach(({ position, citation }) => {
    const insertPos = position + offset;
    if (insertPos < result.length) {
      result = result.slice(0, insertPos) + ` ${citation}` + result.slice(insertPos);
      offset += citation.length + 1;
    }
  });

  return result;
}