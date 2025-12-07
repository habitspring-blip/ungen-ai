/**
 * Input Handler Service
 * Processes various file formats and extracts text content
 * Implements the Input Handler microservice from the AI Summarizer architecture
 */

import type { DocumentMetadata } from './types';
import { validateDocumentInput, validateFileType } from './utils/validation';
import { createClient } from '@/lib/supabase/server';
import { LanguageDetector } from './utils/language-detection';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export class InputHandler {
  private languageDetector: LanguageDetector;

  constructor() {
    this.languageDetector = new LanguageDetector();
  }

  /**
   * Process file upload and extract text content
   * Implements the INPUT_HANDLER algorithm from the PDF
   */
  async processFile(file: File, userId: string): Promise<{ documentId: string; text: string; metadata: DocumentMetadata }> {
    // Validate file type and size
    if (!this.validateFileType(file.name)) {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    if (!this.validateFileSize(file)) {
      throw new Error(`File too large: ${file.size} bytes (max: ${10 * 1024 * 1024})`);
    }

    let text: string;

    // Extract text based on file type
    switch (this.getFileExtension(file.name).toLowerCase()) {
      case 'pdf':
        text = await this.extractFromPDF(file);
        break;
      case 'docx':
        text = await this.extractFromDOCX(file);
        break;
      case 'html':
        text = await this.extractFromHTML(file);
        break;
      case 'txt':
      case 'md':
        text = await this.extractFromText(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${file.name}`);
    }

    // Generate metadata
    const metadata = this.generateMetadata(text, file.name);

    // Store in database and queue for preprocessing
    const documentId = await this.storeDocument(text, metadata, userId);

    return { documentId, text, metadata };
  }

  /**
   * Process plain text input
   */
  async processText(text: string, userId: string, fileName?: string): Promise<{ documentId: string; text: string; metadata: DocumentMetadata }> {
    const metadata = this.generateMetadata(text, fileName);
    const documentId = await this.storeDocument(text, metadata, userId);
    return { documentId, text, metadata };
  }

  /**
   * Process URL content (future enhancement)
   */
  async processURL(url: string): Promise<{ text: string; metadata: DocumentMetadata }> {
    // TODO: Implement URL fetching and content extraction
    throw new Error('URL processing not yet implemented');
  }

  /**
   * Extract text from PDF files using pdf-parse
   */
  private async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const data = await pdfParse(buffer);
      const text = data.text;

      if (!text || text.trim().length < 10) {
        throw new Error('Could not extract readable text from PDF');
      }

      return text.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOCX files using mammoth
   */
  private async extractFromDOCX(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      if (!text || text.trim().length < 10) {
        throw new Error('Could not extract readable text from DOCX');
      }

      return text.trim();
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  /**
   * Extract text from HTML files
   */
  private async extractFromHTML(file: File): Promise<string> {
    const text = await file.text();
    return this.stripHTML(text);
  }

  /**
   * Extract text from plain text files
   */
  private async extractFromText(file: File): Promise<string> {
    return await file.text();
  }

  /**
   * Strip HTML tags and extract text content
   */
  private stripHTML(html: string): string {
    // Basic HTML stripping - in production use a proper HTML parser
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }


  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop() || '';
  }

  /**
   * Validate file size
   */
  validateFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): string[] {
    return ['.txt', '.pdf', '.docx', '.html', '.md'];
  }

  /**
   * Validate file type
   */
  private validateFileType(fileName: string): boolean {
    const extension = this.getFileExtension(fileName).toLowerCase();
    return this.getSupportedTypes().some(type => type.slice(1) === extension);
  }

  /**
   * Generate document metadata
   */
  private generateMetadata(text: string, fileName?: string): DocumentMetadata {
    const language = this.languageDetector.detect(text);
    const wordCount = this.languageDetector.countWords(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      id: crypto.randomUUID(),
      originalLength: text.length,
      wordCount,
      sentenceCount: sentences.length,
      language: language.language,
      fileName: fileName || 'untitled.txt',
      fileType: this.getFileExtension(fileName || 'untitled.txt'),
      uploadTime: new Date().toISOString(),
      userId: '', // Will be set by caller
    };
  }

  /**
   * Store document in database and queue for preprocessing
   */
  private async storeDocument(text: string, metadata: DocumentMetadata, userId: string): Promise<string> {
    const supabase = await createClient();

    // Generate document ID
    const documentId = crypto.randomUUID();

    // Store document
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: userId,
        original_text: text,
        file_name: metadata.fileName,
        file_type: metadata.fileType,
        language: metadata.language,
        status: 'preprocessing',
        metadata: {
          word_count: metadata.wordCount,
          sentence_count: metadata.sentenceCount,
          original_length: metadata.originalLength,
        },
        created_at: new Date(),
      });

    if (docError) {
      console.error('Failed to store document:', docError);
      throw new Error('Failed to store document');
    }

    // Queue for preprocessing (in a real implementation, this would use Redis pub/sub)
    // For now, we'll just mark it as queued
    console.log(`Document ${documentId} queued for preprocessing`);

    return documentId;
  }
}