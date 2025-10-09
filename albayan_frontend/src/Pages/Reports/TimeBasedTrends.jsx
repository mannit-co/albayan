import React, { useState, useEffect } from "react";
import {
  FaChartLine, // trending up
  FaArrowUp,   // arrow up
  FaUsers      // users
} from "react-icons/fa";
import { useLanguage } from "../../contexts/LanguageContext";
import {  BaseUrl,uid } from "../../Api/Api";

const TimeBasedTrends = ({ selectedDays = "7d" }) => {
  const { t } = useLanguage();
  const [dailyActivityData, setDailyActivityData] = useState({});
  const [monthlyPerformanceData, setMonthlyPerformanceData] = useState({});
  const [trendAnalysisData, setTrendAnalysisData] = useState({});

  // Fetch analytics data from API
  const fetchAnalyticsData = async (days) => {
    try {
      const daysMap = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365
      };
      const dayValue = daysMap[days] || 7;
      
      const response = await fetch(
        `${BaseUrl}/getd?day=${dayValue}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );

      const data = await response.json();

      if (data.dailyActivityTrends) {
        setDailyActivityData(data.dailyActivityTrends);
      }

      if (data.monthlyPerformance) {
        setMonthlyPerformanceData(data.monthlyPerformance);
      }

      if (data.trendAnalysis) {
        setTrendAnalysisData(data.trendAnalysis);
      }
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(selectedDays);
  }, [selectedDays]);

  // Calculate daily activity chart points
  const getDailyChartPoints = () => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const maxValue = Math.max(...days.map(day => dailyActivityData[day] || 0), 1);
    
    return days.map((day, index) => {
      const value = dailyActivityData[day] || 0;
      const yPos = 160 - (value / maxValue) * 140; // Scale to fit chart
      const xPos = 10 + (index * 63.33);
      return { x: xPos, y: yPos };
    });
  };

  const dailyPoints = getDailyChartPoints();
  return (
    <div className="space-y-6">
      
      {/* Daily + Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Activity Trends */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            {t('dailyActivityTrends' )}
          </h3>
          <div className="relative h-40 sm:h-48">
            {/* Static SVG placeholder for chart */}
            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="0" x2="400" y2="0" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="40" x2="400" y2="40" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="160" x2="400" y2="160" stroke="#F0FDF4" strokeWidth="1" />
              <polyline
                points={dailyPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
              />
              <polygon
                points={`10,200 ${dailyPoints.map(p => `${p.x},${p.y}`).join(' ')} 390,200`}
                fill="url(#blueGradient)"
              />
              {dailyPoints.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r="4" fill="#3B82F6" />
              ))}
            </svg>
            <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-gray-600">
              <span>{t('mon')}</span><span>{t('tue')}</span><span>{t('wed')}</span>
              <span>{t('thu')}</span><span>{t('fri')}</span><span>{t('sat')}</span><span>{t('sun')}</span>
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            {t('monthlyPerformance')}
          </h3>
          <div className="relative h-40 sm:h-48">
            {/* Static SVG placeholder for chart */}
            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="0" x2="400" y2="0" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="40" x2="400" y2="40" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="#F0FDF4" strokeWidth="1" />
              <line x1="0" y1="160" x2="400" y2="160" stroke="#F0FDF4" strokeWidth="1" />
              <polyline
                points="10,60 86,55 162,50 238,57 314,53 390,48"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
              />
              <polygon
                points="10,200 10,60 86,55 162,50 238,57 314,53 390,48 390,200"
                fill="url(#blueGradient)"
              />
              <circle cx="10" cy="60" r="4" fill="#3B82F6" />
              <circle cx="86" cy="55" r="4" fill="#3B82F6" />
              <circle cx="162" cy="50" r="4" fill="#3B82F6" />
              <circle cx="238" cy="57" r="4" fill="#3B82F6" />
              <circle cx="314" cy="53" r="4" fill="#3B82F6" />
              <circle cx="390" cy="48" r="4" fill="#3B82F6" />
            </svg>
          </div>
        </div>

      </div>

      {/* Trend Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          {t('trendAnalysis')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Assessment Growth */}
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <FaChartLine className="text-blue-600 text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-blue-900">
              {trendAnalysisData["Assessment Growth"] ? `+${trendAnalysisData["Assessment Growth"].toFixed(1)}%` : '0%'}
            </div>
            <div className="text-xs sm:text-sm text-blue-700">{t('assessmentGrowth')}</div>
          </div>

          {/* Score Improvement */}
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <FaArrowUp className="text-green-600 text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-green-900">
              {trendAnalysisData["Score Improvement"] ? `+${trendAnalysisData["Score Improvement"].toFixed(1)}%` : '0%'}
            </div>
            <div className="text-xs sm:text-sm text-green-700">{t('scoreImprovement')}</div>
          </div>

          {/* Candidate Engagement */}
          <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
            <FaUsers className="text-purple-600 text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-purple-900">
              {trendAnalysisData["Candidates Engagement"] ? `+${trendAnalysisData["Candidates Engagement"].toFixed(1)}%` : '0%'}
            </div>
            <div className="text-xs sm:text-sm text-purple-700">{t('candidateEngagement')}</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TimeBasedTrends;
