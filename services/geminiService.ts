


import { GoogleGenAI, Type, Chat } from "@google/genai";
import { FarmXForecast, MarketData, MarketTrend, ChatMessage, PestAnalysisResult, SeedRecommendationResult } from '../types';

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

// Schema for translated forecast - allows string for decision to support translation while keeping enum-like structure conceptually
const translatedForecastSchema = {
    ...forecastSchema,
    properties: {
        ...forecastSchema.properties,
        recommendation: {
            ...forecastSchema.properties.recommendation,
            properties: {
                ...forecastSchema.properties.recommendation.properties,
                decision: { type: Type.STRING } // Allow translated string
            }
        },
        forecast: {
            ...forecastSchema.properties.forecast,
             properties: {
                ...forecastSchema.properties.forecast.properties,
                expectedDemand: { type: Type.STRING },
                riskLevel: { type: Type.STRING }
             }
        }
    }
}


const trendsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            trend: { type: Type.STRING },
            description: { type: Type.STRING }
        },
        required: ['trend', 'description']
    }
}

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

const chatHistorySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.NUMBER },
            role: { type: Type.STRING },
            text: { type: Type.STRING }
        },
        required: ['id', 'role', 'text']
    }
};

const pestAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    issueName: { type: Type.STRING },
    confidenceScore: { type: Type.NUMBER },
    severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
    actionSteps: { 
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    detectedCrop: { type: Type.STRING }
  },
  required: ['issueName', 'confidenceScore', 'severity', 'actionSteps', 'detectedCrop']
};

const seedInfoSchema = {
    type: Type.OBJECT,
    properties: {
        varietyName: { type: Type.STRING },
        suitabilityReason: { type: Type.STRING },
        yieldRange: { type: Type.STRING },
        resistanceTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
        maturityDuration: { type: Type.STRING },
        costRange: { type: Type.STRING },
        performanceTip: { type: Type.STRING }
    },
    required: ['varietyName', 'suitabilityReason', 'yieldRange', 'resistanceTraits', 'maturityDuration', 'costRange', 'performanceTip']
};

const seedResultSchema = {
    type: Type.OBJECT,
    properties: {
        bestMatch: seedInfoSchema,
        alternative: seedInfoSchema,
        budget: seedInfoSchema
    },
    required: ['bestMatch', 'alternative', 'budget']
};

export async function getFarmXForecast(region: string, crop: string): Promise<FarmXForecast> {
  const prompt = `
    You are FarmX, an AI agricultural advisor for the Indian marketplace. Your function is to provide crop demand forecasts.

    Generate a detailed analysis for the following:
    Region: ${region}
    Crop: ${crop}

    IMPORTANT: You MUST provide your entire response in English.
    You MUST provide your response in a valid JSON format that adheres to the schema provided. Do not include any text, markdown, or explanations outside of the JSON object.
    
    For the historical data, provide a table for the last 24 months. For the 'monthYear' field, use the full month name followed by the year (e.g., 'January 2023').
    The recommendation should be concise and actionable for a farmer.
    The "why" section should be a simple 2-3 line explanation.
    CRITICAL: If the selected crop is not climatically suitable for cultivation in the selected region (e.g., Apple in Bangalore/South India, Rubber in Rajasthan), you MUST NOT recommend '✅ GROW'. Instead, return '❌ AVOID' or '⚠️ CAUTION' and explicitly state that the climate is unsuitable in the 'whyRecommendation' field.
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

export async function translateForecast(data: FarmXForecast, targetLanguage: string): Promise<FarmXForecast> {
    const prompt = `
        You are a professional agricultural translator. Translate the values in the following JSON object into ${targetLanguage}.
        
        Rules:
        1. Maintain the exact JSON structure and keys.
        2. Keep all numeric values (like prices, confidence scores) exactly as they are.
        3. For 'monthYear', translate the month name.
        4. For 'decision', translate the text but KEEP the emoji at the start (e.g., '✅ GROW' -> '✅ [Translated Text]').
        5. Translate 'analysisTitle', 'marketStatus', 'expectedDemand', 'priceRange', 'riskLevel', 'bestPlantingTime', 'bestSellingTime', 'targetMarkets', 'whyRecommendation', 'overviewSummary', and 'dataSources'.
        
        Input JSON:
        ${JSON.stringify(data)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: translatedForecastSchema,
                ...modelConfigForSpeed,
            },
        });
        
        return JSON.parse(response.text.trim()) as FarmXForecast;
    } catch (error) {
        console.error("Forecast translation failed:", error);
        return data; // Fallback to original if translation fails
    }
}

export async function getMarketTrends(): Promise<MarketData> {
  const prompt = `
    You are FarmX. Perform a Google Search to find the latest agricultural news, market updates, and government schemes in India from reputable news sources (e.g., The Hindu, Economic Times, Krishi Jagran) from the last 7 days.

    Return the top 5 most relevant and impactful items as a STRICT JSON array of objects. Each object must have:
    - "trend": A short, catchy headline.
    - "description": A 1-2 sentence summary of the news story.

    Example format:
    [
      {"trend": "Onion Export Ban Lifted", "description": "The government has allowed onion exports, leading to a rise in domestic prices."},
      ...
    ]
    
    Provide the response in English.
    Do not use markdown formatting (like \`\`\`json). Return only the JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are NOT allowed with googleSearch
        ...modelConfigForSpeed,
      },
    });

    // Parse JSON from text response
    let jsonText = response.text || '';
    // Clean up markdown code blocks if present
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let trends: MarketTrend[] = [];
    try {
        trends = JSON.parse(jsonText);
    } catch (e) {
        console.warn("Failed to parse market trends JSON, using fallback parsing or empty array", e);
        trends = [];
    }

    // Extract grounding chunks for sources
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
        chunks.forEach(chunk => {
            if (chunk.web?.uri && chunk.web?.title) {
                sources.push({
                    title: chunk.web.title,
                    uri: chunk.web.uri
                });
            }
        });
    }

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i).slice(0, 4);

    return { trends, sources: uniqueSources };

  } catch (error) {
    console.error("Gemini API call for market trends failed:", error);
    throw new Error("Failed to get market trends from AI.");
  }
}

export async function translateMarketTrends(trends: MarketTrend[], targetLanguage: string): Promise<MarketTrend[]> {
    const prompt = `
        Translate the 'trend' and 'description' fields in the following JSON array to ${targetLanguage}.
        Maintain the array structure.
        
        Input JSON:
        ${JSON.stringify(trends)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: trendsSchema,
                ...modelConfigForSpeed,
            },
        });
        
        return JSON.parse(response.text.trim()) as MarketTrend[];
    } catch (error) {
         console.error("Market trends translation failed:", error);
         return trends; // Fallback
    }
}

export async function translateChatHistory(messages: ChatMessage[], targetLanguage: string): Promise<ChatMessage[]> {
    if (messages.length === 0) return [];
    
    // Simple filter to reduce cost: only translate the last 10 messages if history is huge
    // But for this app, we'll try to translate all for consistency.
    
    const prompt = `
        You are a professional translator. Translate the 'text' field of these chat messages into ${targetLanguage}.
        Keep 'id' and 'role' unchanged.
        Do not translate the 'id'.
        
        Input JSON:
        ${JSON.stringify(messages)}
    `;

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: chatHistorySchema,
                 ...modelConfigForSpeed,
            },
        });
        return JSON.parse(response.text.trim()) as ChatMessage[];
    } catch (e) {
        console.error("Chat translation failed", e);
        return messages;
    }
}

export async function analyzeCropHealth(imageBase64: string, cropHint?: string): Promise<PestAnalysisResult> {
  const prompt = `
    You are an expert plant pathologist and agronomist. Analyze this image for potential crop pests, diseases, or nutrient deficiencies.
    ${cropHint ? `The user indicates this might be a '${cropHint}' plant.` : ''}

    Identify:
    1. The detected crop (if possible).
    2. Any specific pest, disease, or issue.
    3. The severity of the issue (Low, Medium, High).
    4. A confidence score (0.0 to 1.0) regarding your diagnosis.
    5. A list of short, actionable steps the farmer can take to treat or manage the issue.

    If no clear issue is detected or the plant looks healthy, return "No clear issue detected" as the issue name, set severity to Low, and provide general care tips in action steps.
    If the image is not of a plant, return "Invalid Image" as the issue name.

    Return the result strictly in English as a valid JSON object matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: pestAnalysisSchema,
        ...modelConfigForSpeed,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as PestAnalysisResult;
  } catch (error) {
    console.error("Crop health analysis failed:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}

export async function translatePestResult(result: PestAnalysisResult, targetLanguage: string): Promise<PestAnalysisResult> {
    const prompt = `
        Translate the values in the following JSON object into ${targetLanguage}.
        Maintain the exact JSON structure and keys.
        Translate 'issueName', 'severity', 'actionSteps', and 'detectedCrop'.
        Do not translate 'confidenceScore'.
        
        Input JSON:
        ${JSON.stringify(result)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: pestAnalysisSchema,
                ...modelConfigForSpeed,
            },
        });
        return JSON.parse(response.text.trim()) as PestAnalysisResult;
    } catch (error) {
         console.error("Pest result translation failed:", error);
         return result;
    }
}

export async function getSeedRecommendations(region: string, crop: string, soilType: string): Promise<SeedRecommendationResult> {
    const prompt = `
      You are an expert agronomist and seed specialist for Indian agriculture.
      Recommend the best seed varieties for the following conditions:
      
      Region: ${region}
      Crop: ${crop}
      Soil Type: ${soilType || 'General for this region'}
      
      Select 3 specific, real-world seed varieties (hybrids or open-pollinated) widely available in India that are suitable for these conditions.
      Rank them as:
      1. Best Match (Overall best performance)
      2. Alternative Option (Good backup or specific trait focus)
      3. Budget Friendly (Cost-effective but reliable)
      
      For each, provide:
      - Variety Name
      - Short reason for suitability
      - Expected yield range (e.g., "25-30 quintals/acre")
      - Resistance traits (pests/diseases)
      - Maturity duration (e.g., "110-120 days")
      - Estimated seed cost range
      - One pro tip for best performance.
      
      Return STRICT JSON output. Output MUST be in English.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: seedResultSchema,
          ...modelConfigForSpeed,
        },
      });
  
      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as SeedRecommendationResult;
    } catch (error) {
      console.error("Seed recommendation failed:", error);
      throw new Error("Failed to get seed recommendations.");
    }
  }
  
  export async function translateSeedRecommendation(result: SeedRecommendationResult, targetLanguage: string): Promise<SeedRecommendationResult> {
      const prompt = `
          Translate the values in the following JSON object into ${targetLanguage}.
          Maintain the exact JSON structure and keys.
          Translate all string values (varietyName, suitabilityReason, yieldRange, resistanceTraits, maturityDuration, costRange, performanceTip).
          
          Input JSON:
          ${JSON.stringify(result)}
      `;
  
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: seedResultSchema,
                  ...modelConfigForSpeed,
              },
          });
          return JSON.parse(response.text.trim()) as SeedRecommendationResult;
      } catch (error) {
           console.error("Seed translation failed:", error);
           return result;
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

export function createChatSession(): Chat {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `
        You are FarmX Assistant, a smart, friendly, and practical agricultural advisor for Indian farmers.
        
        **Your Knowledge Base (FarmX Platform Features):**
        1. **Market Forecast**: You can generate detailed 6-month price and demand forecasts for specific crops and regions.
        2. **Market Trends**: The platform displays the latest agricultural news and trends sourced from reliable APIs.
        3. **Climate Map**: There is a map feature showing terrain and climate context for the selected region.
        4. **Crop Doctor**: The user can upload images to detect pests and diseases.
        5. **Seed Recommender**: The user can find the best seed varieties for their crop, region, and soil type.
        6. **Translation**: The entire FarmX app supports multiple Indian languages.
        
        **Your Goal:** Help farmers by answering questions about crop care, market trends, prices, farming techniques, and how to use this app.
        
        **Guidelines:**
        1. **Concise & Direct**: Keep your answers short and to the point. Farmers are busy and prefer quick answers.
        2. **Use Bullet Points**: Whenever possible, use bullet points (points) to list steps, tips, or reasons. This makes the information easier to read.
        3. **Simple Language**: Explain complex topics in easy-to-understand terms. Avoid jargon.
        4. **Practical Advice**: Give actionable steps (e.g., "Water twice a week" instead of "Maintain optimal moisture").
        5. **Context Aware**: If the user asks about "this crop" or "this region", refer to the provided context.
        6. **Valid Data**: You have access to Google Search. Use it to answer questions about CURRENT market prices, recent news, or specific weather events if you don't know the answer.
        7. **Language**: You are multilingual and support English, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, and Gujarati.
           - Adapt to the language specified in the user's context instructions or the language the user is typing in.
           - If the user types in English, reply in English.
           - Ensure your responses are culturally appropriate for Indian farmers.
        
        **Topics you can handle:**
        - Crop Care: Soil prep, fertilizers (NPK), irrigation, pest control, disease symptoms.
        - Market Advice: Selling time windows, target markets (mandis), demand/supply trends.
        - App Help: "How do I see the map?", "What does the confidence score mean?"
        - Real-time queries: "What is the price of tomatoes in Nashik today?" (Use Google Search).
        
        If asked about something unrelated to farming/agriculture/weather/markets/FarmX, politely say you only know about farming.
      `,
    },
  });
}