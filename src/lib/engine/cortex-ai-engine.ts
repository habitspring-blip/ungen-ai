"use server";

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Enhanced CortexAI Engine with Ethical AI Capabilities
 * Focused on product features with strict content safety
 */
export class CortexAIEngine {
  private static ETHICAL_GUIDELINES = {
    forbiddenTopics: [
      'hate speech', 'harassment', 'discrimination', 'violence',
      'illegal activities', 'adult content', 'sexual content',
      'political extremism', 'religious extremism', 'conspiracy theories',
      'medical advice', 'legal advice', 'financial advice',
      'personal attacks', 'offensive language', 'slurs'
    ],
    contentQualityRules: [
      'Only discuss provided text',
      'Never invent facts or information',
      'Base suggestions on observable issues',
      'Be specific and actionable',
      'Call out gibberish or nonsensical content'
    ],
    acceptableUseCases: [
      'writing improvement', 'grammar checking', 'style suggestions',
      'tone enhancement', 'structure improvement', 'brainstorming',
      'professional writing', 'creative writing', 'academic writing'
    ]
  };

  /**
   * Enhanced AI Introduction with Feature Options
   */
  public static getWelcomeMessage(): string {
    return `Hi! I'm CortexAI, your AI Writing Assistant.

How can I help you today? I specialize in:
• Writing improvement and editing
• Grammar, style, and clarity enhancements
• Tone and structure optimization
• AI content detection and analysis

What would you like to do?`;
  }

  /**
   * Get Feature Options for User Selection
   */
  public static getFeatureOptions(): Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
  }> {
    return [
      {
        id: 'rewrite',
        title: 'Rewrite & Improve',
        description: 'Enhance your writing with AI-powered suggestions',
        icon: '✍️'
      },
      {
        id: 'ai-detect',
        title: 'AI Detection',
        description: 'Analyze content for AI generation patterns',
        icon: '🔍'
      },
      {
        id: 'grammar',
        title: 'Grammar Check',
        description: 'Comprehensive grammar and style analysis',
        icon: '📝'
      },
      {
        id: 'tone',
        title: 'Tone Analysis',
        description: 'Analyze and adjust writing tone',
        icon: '🎨'
      }
    ];
  }

  /**
   * Enhanced AI Response with Ethical Filtering
   */
  public static async generateResponse(
    userId: string,
    text: string,
    feature: 'rewrite' | 'ai-detect' | 'grammar' | 'tone',
    options: Record<string, unknown> = {}
  ): Promise<{
    success: boolean;
    response: string;
    ethicalWarning?: string;
    featureUsed: string;
  }> {
    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        response: "Please provide some text to analyze.",
        featureUsed: feature
      };
    }

    // Check for ethical violations
    const ethicalCheck = this.checkEthicalCompliance(text);
    if (!ethicalCheck.isCompliant) {
      return {
        success: false,
        response: ethicalCheck.warningMessage || "Content violates ethical guidelines",
        ethicalWarning: ethicalCheck.warningMessage,
        featureUsed: feature
      };
    }

    // Check for gibberish or nonsensical content
    const qualityCheck = this.checkContentQuality(text);
    if (!qualityCheck.isValid) {
      return {
        success: false,
        response: qualityCheck.warningMessage || "Content quality issues detected",
        ethicalWarning: qualityCheck.warningMessage,
        featureUsed: feature
      };
    }

    // Generate appropriate response based on feature
    try {
      const response = await this.generateFeatureResponse(feature, text, options);

      return {
        success: true,
        response: response,
        featureUsed: feature
      };
    } catch (error) {
      console.error(`CortexAI ${feature} error:`, error);
      return {
        success: false,
        response: "I'm having trouble processing your request. Please try again.",
        featureUsed: feature
      };
    }
  }

  /**
   * Ethical Compliance Checker
   */
  private static checkEthicalCompliance(text: string): {
    isCompliant: boolean;
    warningMessage?: string;
  } {
    const lowerText = text.toLowerCase();

    // Check for forbidden topics
    for (const topic of this.ETHICAL_GUIDELINES.forbiddenTopics) {
      if (lowerText.includes(topic)) {
        return {
          isCompliant: false,
          warningMessage: `I cannot assist with content related to ${topic}. I'm designed to help with constructive writing tasks only.`
        };
      }
    }

    // Check for offensive language patterns
    const offensivePatterns = [
      /fuck|shit|bitch|asshole|dick|pussy|cunt|nigga|fag|retard/i,
      /hate|kill|murder|rape|violence|terror/i,
      /porn|sex|nude|erotic|adult|nsfw/i
    ];

    for (const pattern of offensivePatterns) {
      if (pattern.test(lowerText)) {
        return {
          isCompliant: false,
          warningMessage: "I cannot assist with content containing offensive language. I'm here to help with professional and constructive writing tasks."
        };
      }
    }

    return { isCompliant: true };
  }

  /**
   * Content Quality Checker
   */
  private static checkContentQuality(text: string): {
    isValid: boolean;
    warningMessage?: string;
  } {
    // Check for gibberish patterns
    const gibberishPatterns = [
      /[a-z]{10,}/i, // Long random strings
      /[0-9]{10,}/, // Long number sequences
      /[!@#$%^&*()]{5,}/, // Long symbol sequences
      /(.)\\1{10,}/ // Repeated characters
    ];

    for (const pattern of gibberishPatterns) {
      if (pattern.test(text)) {
        return {
          isValid: false,
          warningMessage: "This appears to be random text or gibberish. Would you like help writing something specific?"
        };
      }
    }

    // Check for minimal meaningful content
    const wordCount = text.split(/\s+/).filter(word => word.length > 2).length;
    if (wordCount < 3 && text.length > 50) {
      return {
        isValid: false,
        warningMessage: "This text seems to lack coherent structure. Would you like help writing something specific?"
      };
    }

    return { isValid: true };
  }

  /**
   * Generate Feature-Specific Response
   */
  private static async generateFeatureResponse(
    feature: string,
    text: string,
    options: Record<string, unknown>
  ): Promise<string> {
    // This would integrate with your existing API endpoints
    // For now, return feature-specific responses

    const featureResponses = {
      'rewrite': `Here's how I can improve your writing:

1. **Grammar & Clarity**: I can check for grammatical errors and suggest clearer phrasing.
2. **Style Enhancement**: I can refine your writing style to match your desired tone.
3. **Structure Optimization**: I can help organize your content for better flow.
4. **Tone Adjustment**: I can adjust the tone to be more professional, friendly, or persuasive.

What specific aspect would you like me to focus on?`,

      'ai-detect': `I can analyze your text for AI generation patterns:

1. **Confidence Score**: Determine likelihood of AI generation
2. **Model Analysis**: Identify potential AI model characteristics
3. **Content Indicators**: Show specific AI writing patterns
4. **Human vs AI**: Compare with human writing traits

Would you like me to perform a full AI detection analysis?`,

      'grammar': `Let me analyze your text for grammar and style:

1. **Grammar Check**: Identify grammatical errors and suggestions
2. **Readability Analysis**: Assess reading level and complexity
3. **Style Suggestions**: Improve writing style and flow
4. **Tone Assessment**: Evaluate tone appropriateness

Should I perform a comprehensive grammar analysis?`,

      'tone': `I can help analyze and adjust your writing tone:

1. **Current Tone**: Identify the current tone of your text
2. **Tone Suggestions**: Recommend appropriate tone adjustments
3. **Audience Matching**: Align tone with target audience
4. **Purpose Alignment**: Ensure tone matches writing purpose

What tone are you aiming for (professional, friendly, persuasive, etc.)?`
    };

    return featureResponses[feature as keyof typeof featureResponses] || "I can help with that! Please provide more details about what you'd like me to do.";
  }

  /**
   * Get AI Capabilities Summary
   */
  public static getCapabilities(): string {
    return `As CortexAI, I can assist with:

📝 **Writing Improvement**
- Grammar and style suggestions
- Clarity and structure enhancement
- Tone and voice adjustment

🔍 **Content Analysis**
- AI detection and analysis
- Readability assessment
- Quality evaluation

✅ **Ethical Guidelines**
- Strict content safety filters
- Professional and constructive only
- No offensive, harmful, or inappropriate content

🚫 **Limitations**
- Only analyze provided text
- No invented facts or information
- Focused on writing assistance only

All responses follow strict ethical guidelines and content safety protocols.`;
  }

  /**
   * Enhanced AI Introduction for Chat Interface
   */
  public static getEnhancedIntroduction(): string {
    return `Hi! I'm CortexAI, your AI Writing Assistant.

I specialize in helping with:
• Writing improvement and editing
• Grammar, style, and clarity enhancements
• Tone and structure optimization
• AI content detection and analysis

What would you like to work on today?`;
  }

  /**
   * Feature Selection Prompt
   */
  public static getFeatureSelectionPrompt(): string {
    return `Here are the main features I can assist with:

1. **Rewrite & Improve** - Enhance your writing
2. **AI Detection** - Analyze content for AI patterns
3. **Grammar Check** - Comprehensive grammar analysis
4. **Tone Analysis** - Adjust writing tone

Which feature would you like to use? (Reply with number or name)`;
  }
}