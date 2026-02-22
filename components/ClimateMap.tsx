import React, { useEffect, useRef, useState } from 'react';
import { REGION_COORDINATES } from '../constants';
import { RainIcon, ThermometerIcon } from './icons/WeatherIcons';

// Declare L global for Leaflet
declare const L: any;

interface ClimateMapProps {
  activeRegion: string | null;
  isDarkMode: boolean;
  t: (key: string) => string;
}

interface WeatherData {
  temperature: number;
  precipitation: number;
}

const ClimateMap: React.FC<ClimateMapProps> = ({ activeRegion, isDarkMode, t }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layerGroupRef = useRef<any>(null);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const fetchWeather = async (lat: number, lng: number) => {
    setLoadingWeather(true);
    setWeatherData(null);

    try {
        const today = new Date().toISOString().split('T')[0];
        // Fetch Forecast API for today
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_sum&timezone=auto&start_date=${today}&end_date=${today}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.daily) {
            setWeatherData({
                temperature: data.daily.temperature_2m_max[0],
                precipitation: data.daily.precipitation_sum[0],
            });
        }
    } catch (e) {
        console.error("Weather fetch failed", e);
    } finally {
        setLoadingWeather(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; 

    const map = L.map(mapContainerRef.current, {
      center: [22.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle Tile Layers
  useEffect(() => {
    if (!layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    if (isDarkMode) {
      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
      });
      const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      });
      layerGroupRef.current.addLayer(satellite);
      layerGroupRef.current.addLayer(labels);
    } else {
      const topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
      });
      layerGroupRef.current.addLayer(topo);
    }
  }, [isDarkMode]);

  // Handle Zoom and Weather Fetch
  useEffect(() => {
    if (!mapRef.current) return;

    if (activeRegion && REGION_COORDINATES[activeRegion]) {
      const [lat, lng] = REGION_COORDINATES[activeRegion];
      mapRef.current.flyTo([lat, lng], 7, { duration: 1.5 });
      fetchWeather(lat, lng);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-1 border border-gray-200 dark:border-slate-700 transition-colors duration-300 mb-8 overflow-hidden">
        <div className="relative h-[400px] md:h-[500px] w-full rounded-lg overflow-hidden z-0">
            <div ref={mapContainerRef} className="h-full w-full bg-slate-200 dark:bg-slate-900" id="climate-map"></div>
            
            {/* Overlay Title - Top Left */}
            <div className="absolute top-3 left-3 md:top-4 md:left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-md shadow-sm border border-gray-200 dark:border-slate-700 pointer-events-none">
                <h3 className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 md:gap-2">
                    🌍 {t('Regional Climate & Terrain')}
                </h3>
            </div>

            {/* Weather Control Panel - Bottom Left on Mobile, Top Right on Desktop */}
            <div className="absolute z-[400] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 
                            bottom-3 left-3 p-3 max-w-[calc(100%-60px)]
                            md:top-4 md:right-4 md:bottom-auto md:left-auto md:p-4 md:min-w-[200px] md:max-w-xs">
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 md:mb-2">{t('Current Weather')}</h4>
                
                {loadingWeather && (
                     <div className="flex justify-center py-2 md:py-4">
                        <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                )}
                
                {!loadingWeather && weatherData ? (
                    <div className="flex md:grid md:grid-cols-2 gap-3 md:gap-4 mt-1 md:mt-2">
                         <div className="text-center flex-1 md:flex-none">
                            <ThermometerIcon className="w-5 h-5 md:w-6 md:h-6 mx-auto text-orange-500 mb-0.5" />
                            <p className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{Math.round(weatherData.temperature)}°C</p>
                            <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400">{t('Max Temp')}</p>
                         </div>
                         <div className="text-center flex-1 md:flex-none">
                            <RainIcon className="w-5 h-5 md:w-6 md:h-6 mx-auto text-blue-500 mb-0.5" />
                            <p className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{weatherData.precipitation}mm</p>
                            <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400">{t('Precipitation')}</p>
                         </div>
                    </div>
                ) : !loadingWeather && (
                    <p className="text-[10px] md:text-xs text-center text-gray-500 italic py-1 md:py-2">{t('Select a region to see weather')}</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default React.memo(ClimateMap);