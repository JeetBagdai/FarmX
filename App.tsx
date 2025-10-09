import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getFarmXForecast, getMarketTrends, getTranslations } from './services/geminiService';
import { FarmXForecast, MarketTrend } from './types';
import { SUPPORTED_CROPS, SUPPORTED_REGIONS, SUPPORTED_LANGUAGES, UI_TEXTS } from './constants';
import Header from './components/Header';
import ForecastCard from './components/ForecastCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import Welcome from './components/Welcome';
import SearchableDropdown from './components/SearchableDropdown';
import MarketTrends from './components/MarketTrends';

export default function App() {
  const [region, setRegion] = useState<string>('');
  const [crop, setCrop] = useState<string>(SUPPORTED_CROPS[0]);
  const [forecast, setForecast] = useState<FarmXForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [trends, setTrends] = useState<MarketTrend[] | null>(null);
  const [trendsLoading, setTrendsLoading] = useState<boolean>(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const [language, setLanguage] = useState<string>('English');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const lastRequest = useRef<{ region: string; crop: string } | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const translateText = async () => {
      if (language === 'English') {
        setTranslations({});
        return;
      }
      setIsTranslating(true);
      try {
        const translatedMap = await getTranslations(UI_TEXTS, language);
        setTranslations(translatedMap);
      } catch (err) {
        console.error("Translation failed", err);
        // Fallback to English
        setLanguage('English');
      } finally {
        setIsTranslating(false);
      }
    };
    translateText();
  }, [language]);

  // Re-fetch forecast on language change if a forecast has already been requested.
  useEffect(() => {
    // Skip effect on initial mount.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
  
    const reFetchForecast = async () => {
      // Only re-fetch if a forecast has been generated previously.
      if (lastRequest.current) {
        setIsLoading(true);
        setError(null);
        setForecast(null); // Clear previous forecast while loading
  
        try {
          const { region: lastRegion, crop: lastCrop } = lastRequest.current;
          const result = await getFarmXForecast(lastRegion, lastCrop, language);
          setForecast(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
  
    reFetchForecast();
    // This effect should only run when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const t = (key: string): string => translations[key] || key;

  const fetchTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      setTrendsError(null);
      const trendsData = await getMarketTrends(language);
      setTrends(trendsData);
    } catch (err) {
      console.error('Error fetching market trends:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not load market trends.';
      setTrendsError(errorMessage);
      setTrends(null); // Clear stale trends on error
    } finally {
      setTrendsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!region || !crop) {
      setError('Please provide both a region and a crop.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setForecast(null);
    // Store the submitted region and crop to allow for re-translation.
    lastRequest.current = { region, crop };

    try {
      const result = await getFarmXForecast(region, crop, language);
      setForecast(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [region, crop, language]);

  return (
    <div className="min-h-screen font-sans text-gray-800">
      <Header
        t={t}
        currentLanguage={language}
        onLanguageChange={setLanguage}
        languages={SUPPORTED_LANGUAGES}
        isTranslating={isTranslating}
      />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Region (State/District)')}
                </label>
                <SearchableDropdown
                  id="region"
                  options={SUPPORTED_REGIONS}
                  value={region}
                  onChange={setRegion}
                  placeholder={t('e.g., Maharashtra or Pune')}
                  required
                  t={t}
                />
              </div>
              <div>
                <label htmlFor="crop" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Crop')}
                </label>
                <select
                  id="crop"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
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
              disabled={isLoading || !region || !crop}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? t('Analyzing...') : t('Get Forecast')}
            </button>
          </form>
        </div>

        <div className="mt-8 max-w-3xl mx-auto">
          <MarketTrends trends={trends} isLoading={trendsLoading} error={trendsError} onRefresh={fetchTrends} t={t} />
          <div className="mt-8">
            {isLoading && <LoadingSpinner t={t} />}
            {error && <ErrorMessage message={error} t={t} />}
            {forecast && <ForecastCard forecast={forecast} t={t} />}
            {!isLoading && !error && !forecast && <Welcome t={t} />}
          </div>
        </div>
      </main>
       <footer className="text-center p-4 mt-8 text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} FarmX. {t('AI-powered insights for modern farming.')}</p>
      </footer>
    </div>
  );
}