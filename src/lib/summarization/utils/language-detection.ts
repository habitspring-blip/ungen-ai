/**
 * Language Detection Utility
 * Simple language detection for text content
 */

export class LanguageDetector {
  /**
   * Detect language from text content
   */
  detect(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'unknown';
    }

    const sample = text.substring(0, 1000).toLowerCase();

    // Simple language detection based on common words and patterns
    if (this.containsWords(sample, ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that'])) {
      return 'en'; // English
    }

    if (this.containsWords(sample, ['der', 'die', 'das', 'und', 'ist', 'in', 'zu', 'von'])) {
      return 'de'; // German
    }

    if (this.containsWords(sample, ['el', 'la', 'los', 'las', 'y', 'es', 'en', 'un'])) {
      return 'es'; // Spanish
    }

    if (this.containsWords(sample, ['le', 'la', 'les', 'et', 'est', 'dans', 'sur', 'avec'])) {
      return 'fr'; // French
    }

    if (this.containsWords(sample, ['il', 'la', 'i', 'e', 'che', 'non', 'per', 'con'])) {
      return 'it'; // Italian
    }

    if (this.containsWords(sample, ['de', 'het', 'een', 'en', 'van', 'ik', 'je', 'hij'])) {
      return 'nl'; // Dutch
    }

    if (this.containsWords(sample, ['o', 'a', 'os', 'as', 'e', 'do', 'da', 'em'])) {
      return 'pt'; // Portuguese
    }

    // Default to English for now
    return 'en';
  }

  /**
   * Check if text contains any of the given words
   */
  private containsWords(text: string, words: string[]): boolean {
    return words.some(word => text.includes(word));
  }

  /**
   * Get language name from code
   */
  getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'unknown': 'Unknown',
    };

    return languages[code] || 'Unknown';
  }

  /**
   * Check if language is supported
   */
  isSupported(code: string): boolean {
    return ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'].includes(code);
  }
}