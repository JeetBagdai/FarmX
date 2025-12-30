import React, { useState, useEffect, useRef } from 'react';
import { SeedIcon } from './icons/SeedIcon';
import { SOIL_TYPES } from '../constants';
import { SeedRecommendationResult, SeedInfo } from '../types';
import { getSeedRecommendations, translateSeedRecommendation } from '../services/geminiService';

interface SeedRecommenderProps {
  region: string;
  subRegion: string;
  crop: string;
  language: string;
  t: (key: string) => string;
  onResultChange?: (result: SeedRecommendationResult | null) => void;
}

const SeedCard: React.FC<{ title: string; info: SeedInfo; badgeColor: string; t: (key: string) => string }> = ({ title, info, badgeColor, t }) => (
  <div className="bg-white dark:bg-slate-700/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-600 flex flex-col h-full hover:shadow-xl hover:border-green-200 dark:hover:border-green-800 transition-all duration-300 group">
    <div className="mb-5">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${badgeColor} mb-3 shadow-sm`}>
            {t(title)}
        </span>
        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
            {info.varietyName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed border-l-4 border-gray-200 dark:border-slate-500 pl-3 py-1">
            "{info.suitabilityReason}"
        </p>
    </div>
    
    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-5 space-y-3 border border-gray-100 dark:border-slate-600/50">
        <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Yield:')}</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm text-right">{info.yieldRange}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Maturity:')}</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm text-right">{info.maturityDuration}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Cost:')}</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm text-right">{info.costRange}</span>
        </div>
    </div>
    
    <div className="mb-5 flex-grow">
        <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
             {t('Resistance:')}
        </span>
        <div className="flex flex-wrap gap-2">
            {info.resistanceTraits.map((trait, i) => (
                <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-500 shadow-sm">
                    {trait}
                </span>
            ))}
        </div>
    </div>

    <div className="mt-auto pt-4 border-t border-dashed border-gray-200 dark:border-slate-600">
        <div className="flex gap-3 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
             <div className="flex-shrink-0 text-lg">💡</div>
             <div>
                <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">{t('Pro Tip:')}</span> 
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    {info.performanceTip}
                </p>
             </div>
        </div>
    </div>
  </div>
);

const SeedRecommender: React.FC<SeedRecommenderProps> = ({ region, subRegion, crop, language, t, onResultChange }) => {
  const [soilType, setSoilType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedRecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rawResultRef = useRef<SeedRecommendationResult | null>(null);
  const cacheRef = useRef<Map<string, SeedRecommendationResult>>(new Map());

  // Notify parent whenever result changes
  useEffect(() => {
    if (onResultChange) {
        onResultChange(result);
    }
  }, [result, onResultChange]);

  // Handle translation
  useEffect(() => {
    const handleTrans = async () => {
        if (!rawResultRef.current) return;
        
        if (language === 'English') {
            setResult(rawResultRef.current);
            return;
        }

        if (cacheRef.current.has(language)) {
            setResult(cacheRef.current.get(language)!);
            return;
        }

        setLoading(true);
        try {
            const translated = await translateSeedRecommendation(rawResultRef.current, language);
            cacheRef.current.set(language, translated);
            setResult(translated);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (result) handleTrans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleGetRecommendations = async () => {
    if (!region || !crop) {
        setError(t('Please select a region and crop first.'));
        return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
        const fullRegion = subRegion ? `${subRegion}, ${region}` : region;
        const data = await getSeedRecommendations(fullRegion, crop, soilType);
        
        rawResultRef.current = data;
        cacheRef.current.clear();
        cacheRef.current.set('English', data);
        
        if (language === 'English') {
            setResult(data);
        } else {
            // Trigger translation effect or do immediate call
             const translated = await translateSeedRecommendation(data, language);
             cacheRef.current.set(language, translated);
             setResult(translated);
        }
        
    } catch (err) {
        console.error(err);
        setError(t('Sorry, something went wrong. Please check your connection.'));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-4">
        <SeedIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('Seed Variety Recommender')}</h2>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
        {t('Find the best seeds for your soil and region.')}
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
         <div className="flex-1">
            <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Soil Type (Optional)')}
            </label>
            <select
                id="soilType"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
                <option value="">{t('Select soil type')}</option>
                {SOIL_TYPES.map(type => (
                    <option key={type} value={type}>{t(type)}</option>
                ))}
            </select>
         </div>
         <div className="flex items-end">
             <button
                onClick={handleGetRecommendations}
                disabled={loading || !region || !crop}
                className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
                {loading ? t('Finding Seeds...') : t('Find Best Seeds')}
             </button>
         </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800 mb-4">
            {error}
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <SeedCard 
                title="Best Match" 
                info={result.bestMatch} 
                badgeColor="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" 
                t={t}
            />
            <SeedCard 
                title="Alternative Option" 
                info={result.alternative} 
                badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" 
                t={t}
            />
            <SeedCard 
                title="Budget Friendly" 
                info={result.budget} 
                badgeColor="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" 
                t={t}
            />
        </div>
      )}
    </div>
  );
};

export default SeedRecommender;