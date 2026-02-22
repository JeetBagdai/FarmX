import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  getFarmXForecast,
  getMarketTrends,
  getTranslations,
  translateForecast,
  translateMarketTrends
} from './services/groqService';
import { FarmXForecast, MarketData, SeedRecommendationResult } from './types';
import { SUPPORTED_CROPS, SUPPORTED_REGIONS, KARNATAKA_DISTRICTS, SUPPORTED_LANGUAGES, UI_TEXTS, REGION_COORDINATES } from './constants';
import Header from './components/Header';
import ForecastCard from './components/ForecastCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import Welcome from './components/Welcome';
import SearchableDropdown from './components/SearchableDropdown';
import MarketTrends from './components/MarketTrends';
import ClimateMap from './components/ClimateMap';
import ChatBot from './components/ChatBot';
import CropDoctor from './components/CropDoctor';
import SeedRecommender from './components/SeedRecommender';

export default function App() {
  const [region, setRegion] = useState<string>('');
  const [subRegion, setSubRegion] = useState<string>('');
  const [crop, setCrop] = useState<string>(SUPPORTED_CROPS[0]);

  // State to control map zoom
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  // Displayed Data
  const [forecast, setForecast] = useState<FarmXForecast | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);

  // Lifted state for Seed Recommender to share with ForecastCard
  const [seedResult, setSeedResult] = useState<SeedRecommendationResult | null>(null);

  // Raw English Data (Source of Truth)
  const [rawForecast, setRawForecast] = useState<FarmXForecast | null>(null);
  const [rawMarketData, setRawMarketData] = useState<MarketData | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trendsLoading, setTrendsLoading] = useState<boolean>(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Settings
  const [language, setLanguage] = useState<string>('English');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Caches for Translations
  const forecastCache = useRef<Map<string, FarmXForecast>>(new Map());
  const trendsCache = useRef<Map<string, MarketData>>(new Map());

  const isInitialMount = useRef(true);

  // Determine if Karnataka is selected (checking English key or translated value)
  const isKarnatakaSelected = useCallback(() => {
    if (region === 'Karnataka') return true;
    if (translations['Karnataka'] && region === translations['Karnataka']) return true;
    return false;
  }, [region, translations]);

  // Reset sub-region when main region changes (unless it's just a translation update)
  useEffect(() => {
    if (!isKarnatakaSelected()) {
      setSubRegion('');
    }
  }, [region, isKarnatakaSelected]);

  // --- Effects ---

  // Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Language Changes: Translate UI, Forecast, and Trends Synchronously
  useEffect(() => {
    // Skip if initial mount (defaults are English)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const performTranslations = async () => {
      setIsTranslating(true);

      // Identify the English keys for current selections BEFORE fetching new translations.
      // We rely on the *current* 'translations' state which maps EnglishKey -> CurrentLanguageValue

      let currentEnglishRegion = region;
      // Try to find the English key for the current region string in the existing translations map
      const foundRegionKey = Object.keys(translations).find(key => translations[key] === region);
      if (foundRegionKey) {
        currentEnglishRegion = foundRegionKey;
      }

      let currentEnglishSubRegion = subRegion;
      const foundSubRegionKey = Object.keys(translations).find(key => translations[key] === subRegion);
      if (foundSubRegionKey) {
        currentEnglishSubRegion = foundSubRegionKey;
      }

      // Define async tasks that return the data needed for state updates
      const getUiTranslationsTask = async () => {
        if (language === 'English') return {};
        try {
          return await getTranslations(UI_TEXTS, language);
        } catch (err) {
          console.error("UI Translation failed", err);
          return {};
        }
      };

      const getForecastTranslationTask = async () => {
        if (!rawForecast) return null;
        if (language === 'English') return rawForecast;

        if (forecastCache.current.has(language)) {
          return forecastCache.current.get(language)!;
        }

        try {
          const translated = await translateForecast(rawForecast, language);
          forecastCache.current.set(language, translated);
          return translated;
        } catch (err) {
          console.error("Forecast translation failed", err);
          return rawForecast;
        }
      };

      const getTrendsTranslationTask = async () => {
        if (!rawMarketData) return null;
        if (language === 'English') return rawMarketData;

        if (trendsCache.current.has(language)) {
          return trendsCache.current.get(language)!;
        }

        try {
          const translatedTrends = await translateMarketTrends(rawMarketData.trends, language);
          const translatedData = { ...rawMarketData, trends: translatedTrends };
          trendsCache.current.set(language, translatedData);
          return translatedData;
        } catch (err) {
          console.error("Trends translation failed", err);
          return rawMarketData;
        }
      };

      try {
        // Wait for ALL translations to complete to ensure uniform update
        const [uiTranslations, translatedForecastData, translatedTrendsData] = await Promise.all([
          getUiTranslationsTask(),
          getForecastTranslationTask(),
          getTrendsTranslationTask()
        ]);

        // Batch update states
        setTranslations(uiTranslations);

        // Update Region/SubRegion Display
        if (language === 'English') {
          // Revert to English
          if (currentEnglishRegion) setRegion(currentEnglishRegion);
          if (currentEnglishSubRegion) setSubRegion(currentEnglishSubRegion);
        } else {
          // Translate to New Language using the English Key
          if (currentEnglishRegion && uiTranslations[currentEnglishRegion]) {
            setRegion(uiTranslations[currentEnglishRegion]);
          } else if (currentEnglishRegion) {
            setRegion(currentEnglishRegion);
          }

          if (currentEnglishSubRegion && uiTranslations[currentEnglishSubRegion]) {
            setSubRegion(uiTranslations[currentEnglishSubRegion]);
          } else if (currentEnglishSubRegion) {
            setSubRegion(currentEnglishSubRegion);
          }
        }

        if (translatedForecastData) {
          setForecast(translatedForecastData);
        } else if (language === 'English' && rawForecast) {
          setForecast(rawForecast);
        }

        if (translatedTrendsData) {
          setMarketData(translatedTrendsData);
        } else if (language === 'English' && rawMarketData) {
          setMarketData(rawMarketData);
        }

      } catch (error) {
        console.error("Error during translation batch update", error);
      } finally {
        setIsTranslating(false);
      }
    };

    performTranslations();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, rawForecast, rawMarketData]);


  // --- Data Fetching ---

  const fetchTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      setTrendsError(null);

      // Always fetch in English first
      const data = await getMarketTrends();
      setRawMarketData(data);

      // Clear cache on new fetch
      trendsCache.current.clear();
      trendsCache.current.set('English', data);

      // If English, we can set it immediately for responsiveness.
      // If not, useEffect will handle the translation update.
      if (language === 'English') {
        setMarketData(data);
      }

    } catch (err) {
      console.error('Error fetching market trends:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not load market trends.';
      setTrendsError(errorMessage);
      setMarketData(null);
      setRawMarketData(null);
    } finally {
      setTrendsLoading(false);
    }
  }, [language]);

  // Initial Trends Fetch
  useEffect(() => {
    fetchTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const t = (key: string): string => translations[key] || key;

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!region || !crop) {
      setError('Please provide both a region and a crop.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setForecast(null);
    setRawForecast(null);
    // Reset seed result on new forecast
    setSeedResult(null);

    // Determine English names for API logic
    const englishRegion = SUPPORTED_REGIONS.find(r => r === region || translations[r] === region) || region;
    const englishSubRegion = subRegion ? (KARNATAKA_DISTRICTS.find(r => r === subRegion || translations[r] === subRegion) || subRegion) : '';

    // Zoom map. If subregion is selected, use it. Otherwise use state.
    // Ensure the region exists in REGION_COORDINATES
    if (englishSubRegion && REGION_COORDINATES[englishSubRegion]) {
      setActiveRegion(englishSubRegion);
    } else {
      setActiveRegion(englishRegion);
    }

    try {
      // Construct the query string. If subregion exists, be more specific.
      const queryRegion = englishSubRegion ? `${englishSubRegion}, ${englishRegion}` : englishRegion;

      // 1. Fetch English Forecast
      const result = await getFarmXForecast(queryRegion, crop);
      setRawForecast(result);

      // Clear cache for new query
      forecastCache.current.clear();
      forecastCache.current.set('English', result);

      // If English, update immediately. If not, wait for useEffect to translate.
      if (language === 'English') {
        setForecast(result);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [region, subRegion, crop, language, translations]);

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Header
        t={t}
        currentLanguage={language}
        onLanguageChange={setLanguage}
        languages={SUPPORTED_LANGUAGES}
        isTranslating={isTranslating}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="container mx-auto p-4 md:p-8 pb-24">

        {/* Welcome Component - Repositioned to Top */}
        {!isLoading && !error && !forecast && (
          <div className="max-w-3xl mx-auto mb-8">
            <Welcome t={t} />
          </div>
        )}

        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 md:p-8 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Region (State/District)')}
                </label>
                <SearchableDropdown
                  id="region"
                  options={SUPPORTED_REGIONS.map(r => t(r))}
                  value={region}
                  onChange={setRegion}
                  placeholder={t('e.g., Maharashtra or Pune')}
                  required
                  t={t}
                />
              </div>

              {/* Conditional Sub-Region (District) Dropdown for Karnataka */}
              {isKarnatakaSelected() && (
                <div>
                  <label htmlFor="subRegion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('District (Optional)')}
                  </label>
                  <SearchableDropdown
                    id="subRegion"
                    options={KARNATAKA_DISTRICTS.map(d => t(d))}
                    value={subRegion}
                    onChange={setSubRegion}
                    placeholder={t('Select a district')}
                    t={t}
                  />
                </div>
              )}

              <div>
                <label htmlFor="crop" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Crop')}
                </label>
                <select
                  id="crop"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  required
                >
                  {SUPPORTED_CROPS.map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || isTranslating || !region || !crop}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? t('Analyzing...') : isTranslating ? t('Translating...') : t('Get Forecast')}
            </button>
          </form>
        </div>

        <div className="mt-8 max-w-3xl mx-auto">
          {/* Crop Doctor is now FIRST */}
          <CropDoctor
            currentCrop={crop}
            language={language}
            t={t}
          />

          {/* Hide Market Trends when a forecast is requested or shown */}
          {!isLoading && !forecast && (
            <div className="mt-8">
              <MarketTrends
                marketData={marketData}
                isLoading={trendsLoading}
                error={trendsError}
                onRefresh={fetchTrends}
                t={t}
              />
            </div>
          )}

          {/* Seed Recommender - Only visible when forecast is available */}
          {!isLoading && forecast && (
            <div className="mt-8">
              <SeedRecommender
                region={region}
                subRegion={subRegion}
                crop={crop}
                language={language}
                t={t}
                onResultChange={setSeedResult}
              />
            </div>
          )}

          <div className="mt-8">
            {/* Show loading spinner if data is loading OR if we are translating pending content */}
            {(isLoading || (isTranslating && !forecast && rawForecast)) && <LoadingSpinner t={t} />}
            {error && <ErrorMessage message={error} t={t} />}
            {!isLoading && forecast && (
              <ForecastCard
                forecast={forecast}
                seedResult={seedResult}
                t={t}
              />
            )}
          </div>

          {/* Map Component - Placed at the very bottom */}
          <div className="mt-8">
            <ClimateMap
              activeRegion={activeRegion}
              isDarkMode={isDarkMode}
              t={t}
            />
          </div>
        </div>
      </main>

      {/* Chatbot Integration */}
      <ChatBot
        forecast={forecast}
        region={subRegion ? `${subRegion}, ${region}` : region}
        crop={crop}
        language={language}
        t={t}
      />

      <footer className="text-center p-4 mt-8 text-sm text-gray-600 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} FarmX. {t('AI-powered insights for modern farming.')}</p>
      </footer>
    </div>
  );
}