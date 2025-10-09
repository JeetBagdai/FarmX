import React, { useState, useEffect, useCallback } from 'react';
import { FarmXForecast, FarmXRecommendation, SixMonthForecast, HistoricalDataPoint } from '../types';
import { ChartIcon } from './icons/ChartIcon';
import { BulbIcon } from './icons/BulbIcon';
import { TargetIcon } from './icons/TargetIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';

// Helper function to determine styling based on the recommendation decision
const getDecisionClasses = (decision: string) => {
  if (decision.includes('GROW') || decision.includes('✅')) return 'bg-green-50 text-green-900 border-green-200';
  if (decision.includes('AVOID') || decision.includes('❌')) return 'bg-red-50 text-red-900 border-red-200';
  if (decision.includes('CAUTION') || decision.includes('⚠️')) return 'bg-yellow-50 text-yellow-900 border-yellow-200';
  return 'bg-gray-50 text-gray-800 border-gray-200';
};

// --- Sub-components for different sections of the forecast card ---

const RecommendationSection: React.FC<{ recommendation: FarmXRecommendation, t: (key: string) => string }> = ({ recommendation, t }) => (
  <div className={`border-2 border-dashed rounded-lg p-4 md:p-6 ${getDecisionClasses(recommendation.decision)}`}>
    <h3 className="text-lg font-semibold mb-3 flex items-center"><BulbIcon />💡 {t('FarmX Recommendation')}</h3>
    <p className="text-3xl font-bold mb-4">{recommendation.decision}</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <p><strong>{t('Best Planting Time:')}</strong> {recommendation.bestPlantingTime}</p>
      <p><strong>{t('Best Selling Time:')}</strong> {recommendation.bestSellingTime}</p>
      <p><strong>{t('Target Markets:')}</strong> {recommendation.targetMarkets}</p>
    </div>
  </div>
);

const WhyRecommendationSection: React.FC<{ whyRecommendation: string, t: (key: string) => string }> = ({ whyRecommendation, t }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2 flex items-center"><TargetIcon />📈 {t('Why This Recommendation?')}</h3>
    <p className="text-gray-600 italic">"{whyRecommendation}"</p>
  </div>
);

const SixMonthForecastSection: React.FC<{ forecast: SixMonthForecast, t: (key: string) => string }> = ({ forecast, t }) => (
  <div className="bg-gray-50 rounded-lg p-4 border">
    <h3 className="text-lg font-semibold mb-3">🔮 {t('6-Month Forecast')}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
      <div className="p-3 bg-blue-50 rounded-md">
        <p className="text-sm font-medium text-blue-800">{t('Expected Demand')}</p>
        <p className="text-xl font-bold text-blue-900">{forecast.expectedDemand}</p>
      </div>
      <div className="p-3 bg-purple-50 rounded-md">
        <p className="text-sm font-medium text-purple-800">{t('Price Range')}</p>
        <p className="text-xl font-bold text-purple-900">{forecast.priceRange}</p>
      </div>
       <div className="p-3 bg-orange-50 rounded-md">
        <p className="text-sm font-medium text-orange-800">{t('Oversupply Risk')}</p>
        <p className="text-xl font-bold text-orange-900">{forecast.riskLevel}</p>
      </div>
    </div>
  </div>
);

const HistoricalDataSection: React.FC<{ historicalData: HistoricalDataPoint[], t: (key: string) => string }> = ({ historicalData, t }) => (
  <div>
    <h3 className="text-lg font-semibold mb-3 flex items-center"><ChartIcon />📊 {t('Historical Data (Last 2 Years)')}</h3>
    {/* Desktop Table View */}
    <div className="hidden md:block overflow-x-auto max-h-80 border rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-stone-100 sticky top-0">
          <tr>
            <th scope="col" className="px-6 py-3">{t('Month')}</th>
            <th scope="col" className="px-6 py-3">{t('Price/Quintal (₹)')}</th>
            <th scope="col" className="px-6 py-3">{t('Market Status')}</th>
          </tr>
        </thead>
        <tbody>
          {historicalData.map((data, index) => (
            <tr key={index} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{data.monthYear}</td>
              <td className="px-6 py-4">₹{data.pricePerQuintal.toLocaleString('en-IN')}</td>
              <td className="px-6 py-4">{data.marketStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Mobile Card View */}
    <div className="block md:hidden max-h-80 overflow-y-auto border rounded-lg">
      <div className="space-y-2 p-2 bg-gray-50">
        {historicalData.map((data, index) => (
          <div key={index} className="bg-white p-3 rounded-md shadow-sm border">
            <div className="flex justify-between items-baseline mb-1">
                <p className="font-semibold text-gray-800 text-base">{data.monthYear}</p>
                <p className="text-lg font-bold text-green-700">₹{data.pricePerQuintal.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-sm">
                <span className="text-gray-500">{t('Market Status')}: </span>
                <span className="font-medium text-gray-700">{data.marketStatus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const OverviewSection: React.FC<{
  summary: string;
  onToggleSpeech: () => void;
  isSpeaking: boolean;
  isSpeechSupported: boolean;
  t: (key: string) => string;
}> = ({ summary, onToggleSpeech, isSpeaking, isSpeechSupported, t }) => (
  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold mb-2 text-green-800">📝 {t('Quick Overview')}</h3>
          <button
              onClick={onToggleSpeech}
              disabled={!isSpeechSupported}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={isSpeaking ? t('Stop Reading') : t('Read Aloud')}
          >
              {isSpeaking ? <StopIcon /> : <SpeakerIcon />}
              <span className="hidden sm:inline">{isSpeaking ? t('Stop Reading') : t('Read Aloud')}</span>
          </button>
      </div>
      <p className="text-gray-700 text-sm">{summary}</p>
  </div>
);

// --- Main ForecastCard Component ---

interface ForecastCardProps {
  forecast: FarmXForecast;
  t: (key: string) => string;
}

const ForecastCard: React.FC<ForecastCardProps> = ({ forecast, t }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  useEffect(() => {
    setIsSpeechSupported('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined');
    return () => {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = useCallback(() => {
    if (!isSpeechSupported || !forecast.overviewSummary) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(forecast.overviewSummary);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking, isSpeechSupported, forecast.overviewSummary]);

  const confidencePercentage = forecast.farmxConfidence > 1
    ? Math.round(forecast.farmxConfidence)
    : Math.round(forecast.farmxConfidence * 100);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-200 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{forecast.analysisTitle}</h2>

      <div className="space-y-8">
        <RecommendationSection recommendation={forecast.recommendation} t={t} />
        <WhyRecommendationSection whyRecommendation={forecast.whyRecommendation} t={t} />
        <SixMonthForecastSection forecast={forecast.forecast} t={t} />
        <HistoricalDataSection historicalData={forecast.historicalData} t={t} />
        <OverviewSection
          summary={forecast.overviewSummary}
          onToggleSpeech={handleToggleSpeech}
          isSpeaking={isSpeaking}
          isSpeechSupported={isSpeechSupported}
          t={t}
        />
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
        <p>
          <strong>{t('FarmX Confidence:')}</strong> 
          <span className="font-bold text-gray-800 ml-1">{confidencePercentage}%</span>
        </p>
        <p className="mt-2 text-xs">
          <strong>{t('Data Sources:')}</strong> {forecast.dataSources}
        </p>
      </div>
    </div>
  );
};

export default React.memo(ForecastCard);