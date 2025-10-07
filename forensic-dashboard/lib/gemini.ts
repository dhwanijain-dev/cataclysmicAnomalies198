import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Gemini doesn't have direct embedding API like OpenAI
    // For now, we'll create a simple hash-based embedding or use a different approach
    // In production, you might want to use a dedicated embedding service
    
    // Simple hash-based embedding (for development purposes)
    const hash = simpleHash(text);
    const embedding = new Array(384).fill(0).map((_, i) => 
      (hash * (i + 1)) % 1000 / 1000 - 0.5
    );
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function analyzeWithAI(prompt: string, context?: string): Promise<string> {
  try {
    // Use available models from the API
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: parseFloat(process.env.TEMPERATURE || '0.3'),
        maxOutputTokens: parseInt(process.env.MAX_TOKENS || '4000'),
      }
    });

    const systemPrompt = `You are a forensic analysis assistant helping investigating officers analyze UFDR (Universal Forensic Extraction Device Report) data. Provide clear, concise, and actionable insights. Focus on identifying patterns, connections, and suspicious activities.`;
    
    const fullPrompt = context 
      ? `${systemPrompt}\n\nContext:\n${context}\n\nQuery: ${prompt}`
      : `${systemPrompt}\n\nQuery: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text() || '';
  } catch (error) {
    console.error('Error with AI analysis:', error);
    
    // Try fallback models that are known to work
    const fallbackModels = ['gemini-2.5-pro', 'gemini-flash-latest', 'gemini-pro-latest'];
    
    for (const fallbackModelName of fallbackModels) {
      try {
        console.log(`Trying fallback model: ${fallbackModelName}`);
        const fallbackModel = genAI.getGenerativeModel({ 
          model: fallbackModelName,
          generationConfig: {
            temperature: parseFloat(process.env.TEMPERATURE || '0.3'),
            maxOutputTokens: parseInt(process.env.MAX_TOKENS || '4000'),
          }
        });
        
        const systemPrompt = `You are a forensic analysis assistant helping investigating officers analyze UFDR (Universal Forensic Extraction Device Report) data. Provide clear, concise, and actionable insights. Focus on identifying patterns, connections, and suspicious activities.`;
        
        const fullPrompt = context 
          ? `${systemPrompt}\n\nContext:\n${context}\n\nQuery: ${prompt}`
          : `${systemPrompt}\n\nQuery: ${prompt}`;

        const result = await fallbackModel.generateContent(fullPrompt);
        const response = await result.response;
        return response.text() || '';
      } catch (fallbackError) {
        console.error(`Fallback model ${fallbackModelName} also failed:`, fallbackError);
        continue; // Try next fallback model
      }
    }
    
    // If all models fail, throw the original error
    throw error;
  }
}