/**
 * Rewrite Execution Agent - Stream-First Orchestrator
 *
 * This module orchestrates the LLM execution with semantic routing for cost optimization,
 * streaming responses, and asynchronous billing. Implements the Stream-First architecture
 * using direct API calls with streaming support.
 */

import { prisma } from '@/lib/prisma';
import type { RewriteRequest } from './2_SmartPromptBuilder';

// Environment variables for API access
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Executes the rewrite operation with streaming response and semantic routing.
 * Uses cost-optimized model selection and asynchronous billing.
 *
 * @param prompt - The intelligent prompt built by SmartPromptBuilder
 * @param request - The original rewrite request
 * @param userId - The authenticated user ID
 * @returns Promise<Response> - Streaming response
 */
export async function executeRewriteStream(
  prompt: string,
  request: RewriteRequest,
  userId: string
): Promise<Response> {
  // Semantic Routing: Cost-optimized model selection
  const selectedModel = selectModelByIntent(request.intent);

  try {
    let response: Response;
    let modelType: string;

    if (selectedModel.type === 'cloudflare') {
      // Use Cloudflare for cost-effective tasks
      response = await runCloudflareStream(prompt, selectedModel.modelId);
      modelType = selectedModel.modelId;
    } else {
      // Use Anthropic for complex tasks
      response = await runAnthropicStream(prompt, selectedModel.modelId);
      modelType = selectedModel.modelId;
    }

    // Set up streaming with async billing
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader();
        let streamedContent = '';

        async function read() {
          if (!reader) return;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // Stream finished - execute async billing
                controller.close();
                processAsyncBilling(userId, request, streamedContent, modelType);
                break;
              }

              // Decode chunk and accumulate content
              const chunk = new TextDecoder().decode(value);
              streamedContent += chunk;

              // Forward chunk to client
              controller.enqueue(value);
            }
          } catch (error) {
            console.error('Stream reading error:', error);
            controller.error(error);
          }
        }

        read();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Streaming execution error:', error);
    throw new Error('Failed to execute rewrite operation');
  }
}

/**
 * Semantic Routing: Selects the most cost-effective model based on intent.
 * Uses simple heuristic to balance cost and quality.
 *
 * @param intent - The rewrite intent
 * @returns Selected model configuration
 */
function selectModelByIntent(intent: RewriteRequest['intent']) {
  // Cost-saving heuristic: Use cheap/fast models for simple tasks
  const simpleTasks = ['grammar', 'simplify'];

  if (simpleTasks.includes(intent)) {
    // Cheap, fast model for basic operations
    return {
      type: 'cloudflare' as const,
      modelId: '@cf/meta/llama-3.1-8b-instruct'
    };
  } else {
    // High-reasoning model for complex creative tasks
    return {
      type: 'anthropic' as const,
      modelId: 'claude-3-5-sonnet-20240620'
    };
  }
}

/**
 * Cloudflare streaming API call
 */
async function runCloudflareStream(prompt: string, modelId: string): Promise<Response> {
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    throw new Error('Cloudflare API credentials not configured');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${modelId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a professional writer. Output only the rewritten text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status}`);
  }

  return response;
}

/**
 * Anthropic streaming API call
 */
async function runAnthropicStream(prompt: string, modelId: string): Promise<Response> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  return response;
}

/**
 * Asynchronous billing and logging processor.
 * Executes credit deduction and database logging after streaming completes.
 */
async function processAsyncBilling(
  userId: string,
  request: RewriteRequest,
  outputText: string,
  modelType: string
): Promise<void> {
  try {
    const wordCount = countWords(outputText);
    const creditsToDeduct = wordCount;

    // Execute in transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Get current user credits
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true }
      });

      if (!user) {
        throw new Error('User not found for billing');
      }

      if (user.credits < creditsToDeduct) {
        throw new Error(`Insufficient credits: ${user.credits} available, ${creditsToDeduct} required`);
      }

      // 2. Deduct credits
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: creditsToDeduct
          }
        }
      });

      // 3. Log the rewrite operation
      await tx.rewrite.create({
        data: {
          userId: userId,
          title: generateTitle(request),
          modelType: modelType,
          inputText: request.text,
          outputText: outputText,
          wordCount: wordCount
        }
      });
    });

    console.log(`✅ Rewrite completed: ${wordCount} words, ${creditsToDeduct} credits deducted from user ${userId}`);

  } catch (error) {
    console.error('Async billing error:', error);
    // Don't throw - billing failures shouldn't break the response
  }
}

/**
 * Generates a descriptive title for the rewrite operation
 */
function generateTitle(request: RewriteRequest): string {
  const intentLabels = {
    humanize: 'Humanize',
    summarize: 'Summarize',
    expand: 'Expand',
    simplify: 'Simplify',
    grammar: 'Grammar Check'
  };

  const baseTitle = intentLabels[request.intent] || 'Rewrite';
  return `${baseTitle} - ${request.targetTone} tone`;
}

/**
 * Counts words in text for billing purposes
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}