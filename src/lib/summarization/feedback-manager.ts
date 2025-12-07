/**
 * Feedback Manager
 * Handles user feedback collection and model improvement pipeline
 */

import type { FeedbackData, SummaryResult } from './types';
import { createClient } from '@/lib/supabase/server';

export class FeedbackManager {
  /**
   * Collect user feedback for a summary
   */
  async collectFeedback(feedback: FeedbackData): Promise<void> {
    const supabase = await createClient();

    // Store feedback in database
    const { error } = await supabase
      .from('feedback')
      .insert({
        summary_id: feedback.summaryId,
        user_id: feedback.userId,
        rating: feedback.rating,
        feedback_type: feedback.type,
        edited_summary: feedback.editedSummary,
        comments: feedback.comments,
        created_at: new Date(),
      });

    if (error) {
      console.error('Failed to store feedback:', error);
      throw new Error('Failed to store feedback');
    }

    // Trigger model improvement if rating is low or edited summary provided
    if (feedback.rating <= 2 || feedback.editedSummary) {
      await this.queueForRetraining(feedback);
    }

    // Update model performance metrics
    await this.updateModelMetrics(feedback);
  }

  /**
   * Get feedback statistics for a summary
   */
  async getFeedbackStats(summaryId: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    commonIssues: string[];
  }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('feedback')
      .select('rating, feedback_type')
      .eq('summary_id', summaryId);

    if (error) {
      console.error('Failed to get feedback stats:', error);
      return { averageRating: 0, totalFeedback: 0, commonIssues: [] };
    }

    const totalFeedback = data.length;
    const averageRating = totalFeedback > 0
      ? data.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
      : 0;

    // Count common issues
    const issueCount: Record<string, number> = {};
    data.forEach(f => {
      issueCount[f.feedback_type] = (issueCount[f.feedback_type] || 0) + 1;
    });

    const commonIssues = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue);

    return { averageRating, totalFeedback, commonIssues };
  }

  /**
   * Queue feedback for model retraining
   */
  private async queueForRetraining(feedback: FeedbackData): Promise<void> {
    // In a production system, this would queue the feedback for batch processing
    // For now, we'll store it for later processing

    const supabase = await createClient();

    // Get original document and summary
    const { data: summaryData, error: summaryError } = await supabase
      .from('summaries')
      .select('document_id, summary_text, config')
      .eq('id', feedback.summaryId)
      .single();

    if (summaryError || !summaryData) {
      console.error('Failed to get summary for retraining:', summaryError);
      return;
    }

    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .select('original_text')
      .eq('id', summaryData.document_id)
      .single();

    if (docError || !documentData) {
      console.error('Failed to get document for retraining:', docError);
      return;
    }

    // Store training example
    const trainingExample = {
      input_text: documentData.original_text,
      target_summary: feedback.editedSummary || summaryData.summary_text,
      original_summary: summaryData.summary_text,
      feedback_rating: feedback.rating,
      feedback_type: feedback.type,
      config: summaryData.config,
      created_at: new Date(),
    };

    // In production, this would go to a training queue
    console.log('Queued training example:', trainingExample);
  }

  /**
   * Update model performance metrics based on feedback
   */
  private async updateModelMetrics(feedback: FeedbackData): Promise<void> {
    const supabase = await createClient();

    // Get the model used for this summary
    const { data: summaryData, error } = await supabase
      .from('summaries')
      .select('model_version')
      .eq('id', feedback.summaryId)
      .single();

    if (error || !summaryData?.model_version) {
      return;
    }

    // Update model metrics (simplified - in production would be more sophisticated)
    const rating = feedback.rating;
    if (rating <= 2) {
      // Low rating - increment negative feedback counter
      console.log(`Model ${summaryData.model_version} received negative feedback`);
    }
  }

  /**
   * Get aggregated feedback analytics
   */
  async getFeedbackAnalytics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalFeedback: number;
    averageRating: number;
    feedbackByType: Record<string, number>;
    modelPerformance: Record<string, { avgRating: number; count: number }>;
  }> {
    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const { data, error } = await supabase
      .from('feedback')
      .select('rating, feedback_type')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Failed to get feedback analytics:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        feedbackByType: {},
        modelPerformance: {},
      };
    }

    const totalFeedback = data.length;
    const averageRating = totalFeedback > 0
      ? data.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
      : 0;

    // Count feedback by type
    const feedbackByType: Record<string, number> = {};
    data.forEach(f => {
      feedbackByType[f.feedback_type] = (feedbackByType[f.feedback_type] || 0) + 1;
    });

    return {
      totalFeedback,
      averageRating,
      feedbackByType,
      modelPerformance: {}, // Would be populated with actual model data
    };
  }

  /**
   * Trigger model retraining based on accumulated feedback
   */
  async triggerRetraining(): Promise<void> {
    const analytics = await this.getFeedbackAnalytics('week');

    // Check if we have enough feedback for retraining
    if (analytics.totalFeedback < 10) {
      console.log('Not enough feedback for retraining');
      return;
    }

    if (analytics.averageRating > 3.5) {
      console.log('Model performance is good, no retraining needed');
      return;
    }

    // Trigger retraining pipeline
    console.log('Triggering model retraining based on feedback');
    // In production, this would start a retraining job
  }

  /**
   * Get suggestions for model improvement based on feedback
   */
  async getImprovementSuggestions(): Promise<string[]> {
    const analytics = await this.getFeedbackAnalytics('month');

    const suggestions: string[] = [];

    // Analyze feedback patterns
    if (analytics.feedbackByType['too_technical'] > analytics.totalFeedback * 0.1) {
      suggestions.push('Consider simplifying technical language in summaries');
    }

    if (analytics.feedbackByType['incomplete'] > analytics.totalFeedback * 0.1) {
      suggestions.push('Improve coverage of key points in summaries');
    }

    if (analytics.feedbackByType['factual_error'] > analytics.totalFeedback * 0.05) {
      suggestions.push('Enhance factual accuracy checking');
    }

    if (analytics.averageRating < 3.0) {
      suggestions.push('Overall model performance needs improvement - consider retraining');
    }

    return suggestions;
  }
}