import { GoogleGenerativeAI } from '@google/generative-ai';

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

interface DisambiguationResult {
  isMatch: boolean;
  confidence: number;
  reasoning: string;
}

export async function disambiguateEntities(
  entity1: {
    name: string;
    type: string;
    address?: string;
    metadata?: Record<string, unknown>;
  },
  entity2: {
    name: string;
    type: string;
    address?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<DisambiguationResult> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are helping to match entity records in a political transparency database.

Determine if these two records refer to the same entity:

Entity 1:
- Name: ${entity1.name}
- Type: ${entity1.type}
${entity1.address ? `- Address: ${entity1.address}` : ''}
${entity1.metadata ? `- Additional info: ${JSON.stringify(entity1.metadata)}` : ''}

Entity 2:
- Name: ${entity2.name}
- Type: ${entity2.type}
${entity2.address ? `- Address: ${entity2.address}` : ''}
${entity2.metadata ? `- Additional info: ${JSON.stringify(entity2.metadata)}` : ''}

Consider:
1. Name variations (abbreviations, common nicknames, typos)
2. Organization name changes over time
3. Address similarities (same building, nearby locations)
4. Business type consistency

Respond in JSON format only, no markdown:
{
  "isMatch": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  try {
    // Clean up the response in case it has markdown code blocks
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    return {
      isMatch: Boolean(parsed.isMatch),
      confidence: Number(parsed.confidence) || 0.5,
      reasoning: String(parsed.reasoning || ''),
    };
  } catch {
    return {
      isMatch: false,
      confidence: 0,
      reasoning: 'Failed to parse response',
    };
  }
}
