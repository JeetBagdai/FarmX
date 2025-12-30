

export interface HistoricalDataPoint {
  monthYear: string;
  pricePerQuintal: number;
  marketStatus: string;
}

export interface SixMonthForecast {
  expectedDemand: 'High' | 'Medium' | 'Low';
  priceRange: string;
  riskLevel: 'High' | 'Medium' | 'Low';
}

export interface FarmXRecommendation {
  decision: '✅ GROW' | '❌ AVOID' | '⚠️ CAUTION';
  bestPlantingTime: string;
  bestSellingTime: string;
  targetMarkets: string;
}

export interface FarmXForecast {
  analysisTitle: string;
  historicalData: HistoricalDataPoint[];
  forecast: SixMonthForecast;
  recommendation: FarmXRecommendation;
  whyRecommendation: string;
  overviewSummary: string;
  farmxConfidence: number;
  dataSources: string;
}

export interface MarketTrend {
  trend: string;
  description: string;
}

export interface MarketData {
  trends: MarketTrend[];
  sources: { title: string; uri: string }[];
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text: string;
}

export interface PestAnalysisResult {
  issueName: string;
  confidenceScore: number;
  severity: 'Low' | 'Medium' | 'High';
  actionSteps: string[];
  detectedCrop: string;
}

export interface SeedInfo {
  varietyName: string;
  suitabilityReason: string;
  yieldRange: string;
  resistanceTraits: string[];
  maturityDuration: string;
  costRange: string;
  performanceTip: string;
}

export interface SeedRecommendationResult {
  bestMatch: SeedInfo;
  alternative: SeedInfo;
  budget: SeedInfo;
}