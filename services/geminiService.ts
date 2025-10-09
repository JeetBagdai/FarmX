import { GoogleGenAI, Type } from "@google/genai";
import { FarmXForecast, MarketTrend } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Add thinkingConfig for performance on data-generating tasks
const modelConfigForSpeed = {
  thinkingConfig: { thinkingBudget: 0 },
};

const forecastSchema = {
  type: Type.OBJECT,
  properties: {
    analysisTitle: { type: Type.STRING },
    historicalData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          monthYear: { type: Type.STRING },
          pricePerQuintal: { type: Type.NUMBER },
          marketStatus: { type: Type.STRING },
        },
        required: ['monthYear', 'pricePerQuintal', 'marketStatus'],
      },
    },
    forecast: {
      type: Type.OBJECT,
      properties: {
        expectedDemand: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        priceRange: { type: Type.STRING },
        riskLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
      },
      required: ['expectedDemand', 'priceRange', 'riskLevel'],
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        decision: { type: Type.STRING, enum: ['✅ GROW', '❌ AVOID', '⚠️ CAUTION'] },
        bestPlantingTime: { type: Type.STRING },
        bestSellingTime: { type: Type.STRING },
        targetMarkets: { type: Type.STRING },
      },
      required: ['decision', 'bestPlantingTime', 'bestSellingTime', 'targetMarkets'],
    },
    whyRecommendation: { type: Type.STRING },
    overviewSummary: { type: Type.STRING },
    farmxConfidence: { type: Type.NUMBER },
    dataSources: { type: Type.STRING },
  },
  required: ['analysisTitle', 'historicalData', 'forecast', 'recommendation', 'whyRecommendation', 'overviewSummary', 'farmxConfidence', 'dataSources'],
};

const marketTrendsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      trend: { type: Type.STRING, description: "A short, catchy title for the market trend." },
      description: { type: Type.STRING, description: "A 1-2 sentence description of the trend." },
    },
    required: ['trend', 'description'],
  },
};

const translationsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      original: { type: Type.STRING },
      translated: { type: Type.STRING },
    },
    required: ['original', 'translated'],
  },
};

export async function getFarmXForecast(region: string, crop: string, language: string): Promise<FarmXForecast> {
  const prompt = `
    You are FarmX, an AI agricultural advisor for the Indian marketplace. Your function is to provide crop demand forecasts.

    Generate a detailed analysis for the following:
    Region: ${region}
    Crop: ${crop}

    IMPORTANT: You MUST provide your entire response in the ${language} language.
    You MUST provide your response in a valid JSON format that adheres to the schema provided. Do not include any text, markdown, or explanations outside of the JSON object.
    
    For the historical data, provide a table for the last 24 months. For the 'monthYear' field, you MUST use the full month name followed by the year (e.g., 'January 2023'). The month name must also be translated into the requested language (${language}).
    The recommendation should be concise and actionable for a farmer.
    The "why" section should be a simple 2-3 line explanation.
    The 'overviewSummary' should be a concise 2-3 sentence summary of the key findings, including the recommendation, main risks, and opportunities.
    The confidence score should be a number between 0.0 and 1.0, reflecting the certainty of your forecast (e.g., 0.85 for 85%).
    Finally, include a brief "dataSources" string explaining the sources used for the analysis (e.g., "Analysis based on historical APMC data, market trends, and seasonal weather forecasts.").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: forecastSchema,
        ...modelConfigForSpeed,
      },
    });

    const jsonText = response.text.trim();
    const parsedData: FarmXForecast = JSON.parse(jsonText);
    return parsedData;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get forecast from AI. The model may be unavailable or the request could not be processed.");
  }
}

export async function getMarketTrends(language: string): Promise<MarketTrend[]> {
  const prompt = `
    You are FarmX, an AI agricultural advisor for the Indian marketplace. Your function is to identify key market trends.
    Provide a list of 3 current and emerging trends in the Indian agricultural market. These could include rising demand for specific crops (like quinoa, millets, or exotic fruits), shifts towards organic farming, new export opportunities, or impacts of recent government policies.
    For each trend, provide a short, catchy title and a 1-2 sentence description.
    
    IMPORTANT: You MUST provide your entire response in the ${language} language.
    You MUST provide your response in a valid JSON format that adheres to the schema provided. Do not include any text, markdown, or explanations outside of the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: marketTrendsSchema,
        ...modelConfigForSpeed,
      },
    });

    const jsonText = response.text.trim();
    const parsedData: MarketTrend[] = JSON.parse(jsonText);
    return parsedData;
  } catch (error) {
    console.error("Gemini API call for market trends failed:", error);
    throw new Error("Failed to get market trends from AI.");
  }
}

const translationsCache: Record<string, Record<string, string>> = {};

export async function getTranslations(texts: string[], targetLanguage: string): Promise<Record<string, string>> {
  if (translationsCache[targetLanguage]) {
    return translationsCache[targetLanguage];
  }

  const prompt = `
    You are an expert translation service. Translate the following list of English UI texts into ${targetLanguage}.
    Return the result as a JSON array of objects, where each object has an 'original' key with the English text and a 'translated' key with its translation.
    Do not translate 'FarmX'.
    Here is the list of texts to translate: ${JSON.stringify(texts)}
    IMPORTANT: You MUST provide your response in a valid JSON format that adheres to the schema. Do not include any other text or markdown.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: translationsSchema,
      },
    });
    const jsonText = response.text.trim();
    const parsedData: { original: string; translated: string }[] = JSON.parse(jsonText);
    const translatedMap = parsedData.reduce((acc, item) => {
      acc[item.original] = item.translated;
      return acc;
    }, {} as Record<string, string>);

    translationsCache[targetLanguage] = translatedMap;
    return translatedMap;

  } catch (error) {
    console.error("Gemini API call for translations failed:", error);
    throw new Error(`Failed to get translations for ${targetLanguage}.`);
  }
}