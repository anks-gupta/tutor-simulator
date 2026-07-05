import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withRateLimit } from '../../../lib/withRateLimit';
import { HITESH_PROMPT, PIYUSH_PROMPT } from '../../../constants/tutor';

/**
 * Handle 1-on-1 tutor chat sessions securely and apply rate limits
 */
export const POST = withRateLimit(async (req: NextRequest, body: any) => {
  const { tutor, chatHistory } = body;

  try {
    if (!tutor || !Array.isArray(chatHistory)) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server config error: OpenAI API Key is missing.' }, { status: 500 });
    }

    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o';
    const systemPrompt = tutor === 'hitesh' ? HITESH_PROMPT : PIYUSH_PROMPT;

    // Convert frontend messages format to standard OpenAI roles
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory.map((msg: any) => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.text
      }))
    ];

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: modelName,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const reply = response.choices[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}, { limitEnvVar: 'CHAT_RATE_LIMIT', defaultLimit: 3 });
