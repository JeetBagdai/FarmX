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