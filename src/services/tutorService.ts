export type Persona = 'hitesh' | 'piyush';

export interface DebateTurn {
  tutor: 'hitesh' | 'piyush';
  text: string;
}

/**
 * Client service method to send chat history to secure Next.js API chat endpoint
 */
export async function chatWithTutor(
  tutor: Persona,
  chatHistory: { role: 'user' | 'model'; text: string }[],
  _apiKey?: string,
  _modelName?: string
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tutor, chatHistory })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  return data.reply;
}

/**
 * Client service method to trigger debate crossover logic in secure Next.js debate API endpoint
 */
export async function generateDebate(
  topic: string,
  _apiKey?: string,
  _modelName?: string
): Promise<DebateTurn[]> {
  const response = await fetch('/api/debate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  return data.debate;
}
