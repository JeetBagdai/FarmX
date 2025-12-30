import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import { LeafIcon } from './icons/LeafIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PestAnalysisResult } from '../types';
import { analyzeCropHealth, translatePestResult } from '../services/geminiService';

interface CropDoctorProps {
  currentCrop: string;
  language: string;
  t: (key: string) => string;
}

const CropDoctor: React.FC<CropDoctorProps> = ({ currentCrop, language, t }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PestAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for translation
  const resultCache = useRef<Map<string, PestAnalysisResult>>(new Map());
  const rawResultRef = useRef<PestAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle translation when language changes
  useEffect(() => {
    const translateCurrentResult = async () => {
        if (!rawResultRef.current) return;
        
        if (language === 'English') {
            setResult(rawResultRef.current);
            return;
        }

        if (resultCache.current.has(language)) {
            setResult(resultCache.current.get(language)!);
            return;
        }

        setIsAnalyzing(true); // Re-use analyzing state for translation loading
        try {
            const translated = await translatePestResult(rawResultRef.current, language);
            resultCache.current.set(language, translated);
            setResult(translated);
        } catch (e) {
            console.error("Failed to translate pest result", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (result) {
        translateCurrentResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      setResult(null);
      setError(null);
      rawResultRef.current = null;
      resultCache.current.clear();
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Remove data URL prefix for API
      const base64Data = selectedImage.split(',')[1];
      
      const analysisResult = await analyzeCropHealth(base64Data, currentCrop);
      rawResultRef.current = analysisResult;
      resultCache.current.set('English', analysisResult);

      if (language === 'English') {
          setResult(analysisResult);
      } else {
          const translated = await translatePestResult(analysisResult, language);
          resultCache.current.set(language, translated);
          setResult(translated);
      }
    } catch (err) {
      console.error(err);
      setError(t('Sorry, something went wrong. Please check your connection.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity: string) => {
      const s = severity.toLowerCase();
      if (s === 'high') return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      if (s === 'medium') return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-4">
        <LeafIcon className="h-6 w-6 text-green-600 dark:text-green-500" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('Crop Doctor')}</h2>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 ml-2">{t('AI Pest & Disease Scanner')}</span>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
        {t('Upload a photo of your crop to instantly identify pests and diseases.')}
      </p>

      {!selectedImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <UploadIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Upload Image')}</span>
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                />
            </label>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Take Photo')}</span>
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={handleFileSelect}
                />
            </label>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 max-h-80 flex justify-center">
                <img src={selectedImage} alt="Crop preview" className="object-contain max-h-full" />
                <button 
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    aria-label={t('Remove Image')}
                >
                    <CloseIcon />
                </button>
            </div>

            {!result && !isAnalyzing && !error && (
                <button
                    onClick={handleAnalyze}
                    className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                    {t('Identify Issue')}
                </button>
            )}

            {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-300">{t('Analyzing Image...')}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-stone-50 dark:bg-slate-700/50 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-slate-600 animate-fade-in">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{result.issueName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('Detected Crop')}: <span className="font-medium text-gray-700 dark:text-gray-300">{result.detectedCrop}</span>
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getSeverityColor(result.severity)}`}>
                            {t(result.severity)}
                        </span>
                    </div>

                    <div className="space-y-4">
                         <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide text-xs">{t('Confidence Score')}</h4>
                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2.5">
                                <div 
                                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.round(result.confidenceScore * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(result.confidenceScore * 100)}%</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide text-xs">{t('Action Steps')}</h4>
                            <ul className="space-y-2">
                                {result.actionSteps.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <span className="min-w-[6px] h-[6px] rounded-full bg-green-500 mt-1.5"></span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CropDoctor;
