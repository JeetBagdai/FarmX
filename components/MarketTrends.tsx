import React, { useState, TouchEvent } from 'react';
import { MarketTrend } from '../types';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { RefreshIcon } from './icons/RefreshIcon';

// --- Sub-components for MarketTrends ---

const TrendSkeleton: React.FC = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border animate-pulse">
    <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-stone-200 rounded w-full"></div>
    <div className="h-3 bg-stone-200 rounded w-5/6 mt-1"></div>
  </div>
);

const MobileTrendsView: React.FC<{ trends: MarketTrend[], t: (key: string) => string }> = ({ trends, t }) => (
  <div className="md:hidden">
    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
      {trends.map((trend, index) => (
        <div key={index} className="bg-stone-100 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-md text-green-800">{trend.trend}</h3>
          <p className="text-sm text-gray-600 mt-1">{trend.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const DesktopTrendsCarousel: React.FC<{
  trends: MarketTrend[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  handlePrev: () => void;
  handleNext: () => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
  t: (key: string) => string;
}> = ({ trends, currentIndex, setCurrentIndex, handlePrev, handleNext, onTouchStart, onTouchMove, onTouchEnd, t }) => (
  <div className="hidden md:block relative">
    <div
      className="overflow-hidden rounded-lg"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {trends.map((trend, index) => (
          <div key={index} className="min-w-full flex-shrink-0">
            <div className="bg-stone-100 p-6 rounded-lg border border-gray-200 h-full flex flex-col justify-center items-center text-center min-h-[120px]">
              <h3 className="font-semibold text-lg text-green-800">{trend.trend}</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md">{trend.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    
    {trends.length > 1 && (
      <>
        <button
          onClick={handlePrev}
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-1.5 text-gray-700 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
          aria-label={t('Previous trend')}
        >
          <ChevronLeftIcon />
        </button>
        <button
          onClick={handleNext}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-1.5 text-gray-700 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
          aria-label={t('Next trend')}
        >
          <ChevronRightIcon />
        </button>
      </>
    )}

    <div className="flex justify-center mt-4 space-x-2">
      {trends.map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentIndex(index)}
          className={`h-2 w-2 rounded-full transition-colors duration-300 ${currentIndex === index ? 'bg-green-600' : 'bg-gray-300 hover:bg-gray-400'}`}
          aria-label={`${t('Go to trend')} ${index + 1}`}
        />
      ))}
    </div>
  </div>
);

// --- Main MarketTrends Component ---

interface MarketTrendsProps {
  trends: MarketTrend[] | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  t: (key: string) => string;
}

const MarketTrends: React.FC<MarketTrendsProps> = ({ trends, isLoading, error, onRefresh, t }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handlePrev = () => trends && setCurrentIndex((prev) => (prev === 0 ? trends.length - 1 : prev - 1));
  const handleNext = () => trends && setCurrentIndex((prev) => (prev === trends.length - 1 ? 0 : prev + 1));

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const hasTrends = !isLoading && !error && trends && trends.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <TrendingUpIcon />
          {t('Latest Market Insights')}
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t('Refresh market trends')}
        >
          <RefreshIcon />
          <span className="hidden sm:inline">{t('Refresh')}</span>
        </button>
      </div>
      
      {isLoading && <div className="space-y-4"><TrendSkeleton /><TrendSkeleton /></div>}
      
      {error && <p className="text-red-600 text-sm">{t('Could not load market trends. Please try again later.')}</p>}
      
      {hasTrends && (
        <>
          <MobileTrendsView trends={trends} t={t} />
          <DesktopTrendsCarousel 
            trends={trends}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            handlePrev={handlePrev}
            handleNext={handleNext}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            t={t}
          />
        </>
      )}

      {!isLoading && !error && (!trends || trends.length === 0) && (
        <p className="text-gray-500 text-sm text-center py-4">{t('No current market trends to display.')}</p>
      )}
    </div>
  );
};

export default React.memo(MarketTrends);