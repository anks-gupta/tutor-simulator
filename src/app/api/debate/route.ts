import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withRateLimit } from '../../../lib/withRateLimit';
import { DEBATE_PROMPT } from '../../../constants/tutor';

/**
 * Handle debate (clash arena) simulations securely and apply rate limits
 */
export const POST = withRateLimit(async (req: NextRequest, body: any) => {
  const { topic } = body;

  try {
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server config error: OpenAI API Key is missing.' }, { status: 500 });
    }

    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o';

    const messages = [
      { role: 'system' as const, content: DEBATE_PROMPT },
      { role: 'user' as const, content: `Topic: ${topic}` }
    ];

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: modelName,
      messages,
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const modelText = response.choices[0]?.message?.content || '';

    // Re-verify and parse debate payload into a valid JSON array format
    try {
      const parsedDirect = JSON.parse(modelText.trim());
      
      if (Array.isArray(parsedDirect)) {
        return NextResponse.json({ debate: parsedDirect });
      }

      if (parsedDirect && typeof parsedDirect === 'object') {
        const keys = Object.keys(parsedDirect);
        for (const key of keys) {
          if (Array.isArray(parsedDirect[key])) {
            return NextResponse.json({ debate: parsedDirect[key] });
          }
        }
      }
    } catch (e) {
      const firstBracket = modelText.indexOf('[');
      const lastBracket = modelText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const jsonCandidate = modelText.substring(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(jsonCandidate);
        if (Array.isArray(parsed)) {
          return NextResponse.json({ debate: parsed });
        }
      }
    }

    throw new Error('Failed to parse debate script as JSON array.');
  } catch (error: any) {
    console.error('Debate API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}, { limitEnvVar: 'DEBATE_RATE_LIMIT', defaultLimit: 1, isDebate: true });
