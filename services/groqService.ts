import Groq from 'groq-sdk';
import {
  FarmXForecast,
  MarketData,
  MarketTrend,
  ChatMessage,
  PestAnalysisResult,
  SeedRecommendationResult,
} from '../types';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not set.');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ─── Helper ──────────────────────────────────────────────────────────────────

async function callJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = TEXT_MODEL
): Promise<T> {
  const completion = await groq.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? '{}';
  return JSON.parse(text) as T;
}

// ─── Forecast ────────────────────────────────────────────────────────────────

export async function getFarmXForecast(
  region: string,
  crop: string
): Promise<FarmXForecast> {
  const systemPrompt = `You are FarmX, an AI agricultural advisor for the Indian marketplace.
You MUST respond with a single valid JSON object matching this schema EXACTLY (no extra keys, no markdown):
{
  "analysisTitle": string,
  "historicalData": [ { "monthYear": string, "pricePerQuintal": number, "marketStatus": string } ],  // 24 months
  "forecast": { "expectedDemand": "High"|"Medium"|"Low", "priceRange": string, "riskLevel": "High"|"Medium"|"Low" },
  "recommendation": { "decision": "✅ GROW"|"❌ AVOID"|"⚠️ CAUTION", "bestPlantingTime": string, "bestSellingTime": string, "targetMarkets": string },
  "whyRecommendation": string,
  "overviewSummary": string,
  "farmxConfidence": number,
  "dataSources": string
}
Rules:
- historicalData MUST have exactly 24 entries (last 24 months). Use full month names like "January 2024".
- recommendation.decision MUST be one of: "✅ GROW", "❌ AVOID", "⚠️ CAUTION".
- If the crop is climatically unsuitable for the region (e.g. Apple in Bangalore), use "❌ AVOID" and explain in whyRecommendation.
- farmxConfidence is a float 0.0–1.0.
- All fields in English.`;

  const userPrompt = `Generate a detailed agricultural forecast for:
Region: ${region}
Crop: ${crop}`;

  try {
    return await callJSON<FarmXForecast>(systemPrompt, userPrompt);
  } catch (error) {
    console.error('Groq forecast failed:', error);
    throw new Error('Failed to get forecast from AI. Please try again.');
  }
}

// ─── Translate Forecast ───────────────────────────────────────────────────────

export async function translateForecast(
  data: FarmXForecast,
  targetLanguage: string
): Promise<FarmXForecast> {
  const systemPrompt = `You are a professional agricultural translator.
Translate the values of the following JSON object into ${targetLanguage}.
Rules:
- Maintain the exact JSON structure and all keys unchanged.
- Keep all numeric values exactly as they are.
- For "monthYear", translate only the month name.
- For "decision", keep the emoji at the start (e.g., "✅ GROW" → "✅ [Translated]").
- Translate: analysisTitle, marketStatus, expectedDemand, priceRange, riskLevel, bestPlantingTime, bestSellingTime, targetMarkets, whyRecommendation, overviewSummary, dataSources.
Return a single JSON object with the same structure as the input.`;

  const userPrompt = JSON.stringify(data);

  try {
    return await callJSON<FarmXForecast>(systemPrompt, userPrompt);
  } catch (error) {
    console.error('Forecast translation failed:', error);
    return data;
  }
}

// ─── Market Trends ───────────────────────────────────────────────────────────

export async function getMarketTrends(): Promise<MarketData> {
  const systemPrompt = `You are FarmX, an agricultural market analyst with deep knowledge of the Indian agricultural market.
Respond with a JSON object containing a single key "trends" which is an array of exactly 5 objects.
Each object MUST have:
- "trend": a short, catchy headline (max 10 words)
- "description": a 1-2 sentence summary

Generate 5 realistic, current-style Indian agricultural market trends for February 2026. Topics can include: MSP announcements, export/import policy, crop price movements, government schemes, seasonal demand shifts, mandi data highlights.
Example format: { "trends": [ { "trend": "...", "description": "..." }, ... ] }`;

  const userPrompt = 'Generate the latest 5 Indian agricultural market trends for today.';

  try {
    const result = await callJSON<{ trends: MarketTrend[] }>(systemPrompt, userPrompt);
    const trends: MarketTrend[] = Array.isArray(result.trends) ? result.trends : [];
    return { trends, sources: [] };
  } catch (error) {
    console.error('Market trends failed:', error);
    throw new Error('Failed to get market trends from AI.');
  }
}

// ─── Translate Market Trends ──────────────────────────────────────────────────

export async function translateMarketTrends(
  trends: MarketTrend[],
  targetLanguage: string
): Promise<MarketTrend[]> {
  const systemPrompt = `You are a professional translator.
Translate the "trend" and "description" fields of the JSON array to ${targetLanguage}.
Maintain the array structure exactly.
Return a JSON object with a single key "items" containing the translated array.`;

  const userPrompt = JSON.stringify(trends);

  try {
    const result = await callJSON<{ items: MarketTrend[] }>(systemPrompt, userPrompt);
    return Array.isArray(result.items) ? result.items : trends;
  } catch (error) {
    console.error('Market trends translation failed:', error);
    return trends;
  }
}

// ─── Translate Chat History ───────────────────────────────────────────────────

export async function translateChatHistory(
  messages: ChatMessage[],
  targetLanguage: string
): Promise<ChatMessage[]> {
  if (messages.length === 0) return [];

  const systemPrompt = `You are a professional translator.
Translate the "text" field of each message in the JSON array to ${targetLanguage}.
Keep "id" and "role" fields unchanged.
Return a JSON object with a single key "messages" containing the translated array.`;

  const userPrompt = JSON.stringify(messages);

  try {
    const result = await callJSON<{ messages: ChatMessage[] }>(systemPrompt, userPrompt);
    return Array.isArray(result.messages) ? result.messages : messages;
  } catch (error) {
    console.error('Chat translation failed:', error);
    return messages;
  }
}

// ─── Crop Health / Pest Analysis ─────────────────────────────────────────────

export async function analyzeCropHealth(
  imageBase64: string,
  cropHint?: string
): Promise<PestAnalysisResult> {
  const systemPrompt = `You are an expert plant pathologist and agronomist.
Analyze the provided plant image for pests, diseases, or nutrient deficiencies.
${cropHint ? `The user indicates this might be a '${cropHint}' plant.` : ''}
Return a JSON object with EXACTLY these keys:
{
  "issueName": string,
  "confidenceScore": number (0.0 to 1.0),
  "severity": "Low"|"Medium"|"High",
  "actionSteps": [string],
  "detectedCrop": string
}
- If no clear issue: issueName = "No clear issue detected", severity = "Low", provide general care tips.
- If not a plant image: issueName = "Invalid Image".
- All text in English.`;

  const userPrompt = 'Analyze this plant image and return the JSON result.';

  try {
    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? '{}';
    return JSON.parse(text) as PestAnalysisResult;
  } catch (error) {
    console.error('Crop health analysis failed:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
}

// ─── Translate Pest Result ────────────────────────────────────────────────────

export async function translatePestResult(
  result: PestAnalysisResult,
  targetLanguage: string
): Promise<PestAnalysisResult> {
  const systemPrompt = `You are a professional translator.
Translate the following JSON object values into ${targetLanguage}.
Maintain the exact JSON structure and keys.
Translate: issueName, severity, actionSteps (array of strings), detectedCrop.
Do NOT translate confidenceScore (keep the number as-is).
Return the translated JSON object.`;

  const userPrompt = JSON.stringify(result);

  try {
    return await callJSON<PestAnalysisResult>(systemPrompt, userPrompt);
  } catch (error) {
    console.error('Pest result translation failed:', error);
    return result;
  }
}

// ─── Seed Recommendations ─────────────────────────────────────────────────────

export async function getSeedRecommendations(
  region: string,
  crop: string,
  soilType: string
): Promise<SeedRecommendationResult> {
  const systemPrompt = `You are an expert agronomist and seed specialist for Indian agriculture.
Respond with a JSON object with EXACTLY this structure:
{
  "bestMatch": { "varietyName": string, "suitabilityReason": string, "yieldRange": string, "resistanceTraits": [string], "maturityDuration": string, "costRange": string, "performanceTip": string },
  "alternative": { ... same fields ... },
  "budget": { ... same fields ... }
}
Select 3 specific, real-world seed varieties (hybrids or open-pollinated) widely available in India suitable for the given conditions.
All output MUST be in English.`;

  const userPrompt = `Recommend seed varieties for:
Region: ${region}
Crop: ${crop}
Soil Type: ${soilType || 'General for this region'}

Rank as:
1. bestMatch – Overall best performance
2. alternative – Good backup or specific trait focus
3. budget – Cost-effective but reliable`;

  try {
    return await callJSON<SeedRecommendationResult>(systemPrompt, userPrompt);
  } catch (error) {
    console.error('Seed recommendation failed:', error);
    throw new Error('Failed to get seed recommendations.');
  }
}

// ─── Translate Seed Recommendation ───────────────────────────────────────────

export async function translateSeedRecommendation(
  result: SeedRecommendationResult,
  targetLanguage: string
): Promise<SeedRecommendationResult> {
  const systemPrompt = `You are a professional translator.
Translate all string values in the following JSON object into ${targetLanguage}.
Maintain the exact JSON structure and keys.
Translate fields: varietyName, suitabilityReason, yieldRange, resistanceTraits (array), maturityDuration, costRange, performanceTip.
Return the complete translated JSON object with the same structure (bestMatch, alternative, budget).`;

  const userPrompt = JSON.stringify(result);

  try {
    return await callJSON<SeedRecommendationResult>(systemPrompt, userPrompt);
  } catch (error) {
    console.error('Seed translation failed:', error);
    return result;
  }
}

// ─── UI Translations ──────────────────────────────────────────────────────────

const translationsCache: Record<string, Record<string, string>> = {};

export async function getTranslations(
  texts: string[],
  targetLanguage: string
): Promise<Record<string, string>> {
  if (translationsCache[targetLanguage]) {
    return translationsCache[targetLanguage];
  }

  const systemPrompt = `You are an expert translation service for Indian languages.
Translate the following English UI texts into ${targetLanguage}.
Return a JSON object with a single key "translations" which is an array.
Each item in the array must have: { "original": string, "translated": string }.
Do NOT translate the word "FarmX".`;

  const userPrompt = JSON.stringify(texts);

  try {
    const result = await callJSON<{ translations: { original: string; translated: string }[] }>(
      systemPrompt,
      userPrompt
    );

    const translatedMap = (result.translations ?? []).reduce(
      (acc, item) => {
        acc[item.original] = item.translated;
        return acc;
      },
      {} as Record<string, string>
    );

    translationsCache[targetLanguage] = translatedMap;
    return translatedMap;
  } catch (error) {
    console.error('Translations failed:', error);
    throw new Error(`Failed to get translations for ${targetLanguage}.`);
  }
}

// ─── Chat Session ─────────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `You are FarmX Assistant, a smart, friendly, and practical agricultural advisor for Indian farmers.

**Your Knowledge Base (FarmX Platform Features):**
1. **Market Forecast**: Generate 6-month price and demand forecasts for specific crops and regions.
2. **Market Trends**: Display the latest agricultural news and trends.
3. **Climate Map**: Map showing terrain and climate context for the selected region.
4. **Crop Doctor**: Upload images to detect pests and diseases.
5. **Seed Recommender**: Find the best seed varieties for crop, region, and soil type.
6. **Translation**: The FarmX app supports multiple Indian languages.

**Guidelines:**
1. **Concise & Direct**: Keep answers short and to the point.
2. **Use Bullet Points**: List steps, tips, or reasons using bullet points.
3. **Simple Language**: Avoid jargon. Use easy-to-understand terms.
4. **Practical Advice**: Give actionable steps.
5. **Language**: Support English, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, and Gujarati. Reply in the language the user is typing in.
6. **Indian Context**: Culturally appropriate for Indian farmers. Mention mandis, MSP, kharif/rabi seasons where relevant.

**Topics:**
- Crop care: Soil prep, fertilizers (NPK), irrigation, pest control, disease symptoms.
- Market advice: Selling windows, target markets (mandis), demand/supply trends.
- App help: Platform features and how to use them.
- General farming: Seasons, climate, government schemes (PM-KISAN, etc.).

If asked about something unrelated to farming/agriculture/weather/markets/FarmX, politely say you only handle farming-related topics.`;

export interface ChatSession {
  sendMessage: (
    message: string,
    history: { role: 'user' | 'model'; text: string }[]
  ) => Promise<string>;
}

export function createChatSession(): ChatSession {
  return {
    async sendMessage(
      message: string,
      history: { role: 'user' | 'model'; text: string }[]
    ): Promise<string> {
      // Convert history to Groq message format
      const groqHistory = history.map((msg) => ({
        role: (msg.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: msg.text,
      }));

      try {
        const completion = await groq.chat.completions.create({
          model: TEXT_MODEL,
          messages: [
            { role: 'system', content: CHAT_SYSTEM_PROMPT },
            ...groqHistory,
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content?.trim() ?? 'Sorry, I could not generate a response.';
      } catch (error) {
        console.error('Chat failed:', error);
        throw new Error('Failed to get a response from the AI assistant.');
      }
    },
  };
}
