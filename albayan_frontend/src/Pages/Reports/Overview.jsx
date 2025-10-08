import React, { useState ,useEffect} from "react";
import {
  FiDownload,
  FiBarChart2,
  FiUsers,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";
import { FaCheckCircle, FaMedal } from "react-icons/fa";
import { fetchTotalCandidates } from "../../Api/Api"; // 👈 import your API function
import { useLanguage } from "../../contexts/LanguageContext";
//  Recharts imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import CandidatesReport from "./CandidatesReport";
import TestPerformance from "./TestPerformance";
import TimeBasedTrends from "./TimeBasedTrends";

//  Colors for each segment
const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

const Reports = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  // 👇 New states
  const [totalCandidates, setTotalCandidates] = useState("0");
  const [loading, setLoading] = useState(false);
  
  //  Pie chart data with translations
  const pieData = [
    { name: t('excellent'), value: 25 },
    { name: t('good'), value: 35 },
    { name: t('average'), value: 28 },
    { name: t('belowAverage'), value: 12 },
  ];
  
  //  Bar chart data with translated months
  const monthlyData = [
    { name: t('jan'), assessments: 85 },
    { name: t('feb'), assessments: 92 },
    { name: t('mar'), assessments: 78 },
    { name: t('apr'), assessments: 95 },
    { name: t('may'), assessments: 88 },
    { name: t('jun'), assessments: 102 },
  ];

    useEffect(() => {
    fetchTotalCandidates(setTotalCandidates, setLoading);
  }, []);
  return (
    <div className="px-3 sm:px-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('analyticsReports')}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {t('comprehensiveAnalytics')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
              <option value="7d">{t('last7Days')}</option>
              <option value="30d">{t('last30Days')}</option>
              <option value="90d">{t('last90Days')}</option>
              <option value="1y">{t('lastYear')}</option>
            </select>
            <button className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <FiDownload size={16} />
              <span>{t('export')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 text-sm">
          {/* Overview */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center space-x-2 py-3 px-2 sm:px-1 border-b-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FiBarChart2 size={16} />
            <span>{t('overview')}</span>
          </button>

          {/* Candidate Reports */}
          <button
            onClick={() => setActiveTab("candidates")}
            className={`flex items-center space-x-2 py-3 px-2 sm:px-1 border-b-2 font-medium transition-colors ${
              activeTab === "candidates"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FiUsers size={16} />
            <span>{t('candidatesReport')}</span>
          </button>

          {/* Test Performance */}
          <button
            onClick={() => setActiveTab("tests")}
            className={`flex items-center space-x-2 py-3 px-2 sm:px-1 border-b-2 font-medium transition-colors ${
              activeTab === "tests"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FiFileText size={16} />
            <span>{t('testPerformance')}</span>
          </button>

          {/* Time-based Trends */}
          <button
            onClick={() => setActiveTab("trends")}
            className={`flex items-center space-x-2 py-3 px-2 sm:px-1 border-b-2 font-medium transition-colors ${
              activeTab === "trends"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FiTrendingUp size={16} />
            <span>{t('timeBasedTrends')}</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6 sm:space-y-8">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FiUsers className="text-blue-600" size={22} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +12%
                </span>
              </div>
               <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {loading ? "Loading..." : totalCandidates}
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                {t("totalCandidates","Total Candidates")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t("activeParticipants")}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <FaCheckCircle className="text-green-600" size={22} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +8%
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                892
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                {t("completedTests")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t("thisMonth")}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <FiTrendingUp className="text-purple-600" size={22} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +3.2%
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                82.5%
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                {t("averageScore","Average Score")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t("acrossalltestes" )}
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <FaMedal className="text-orange-600" size={22} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +15%
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                156
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                {t("topPerformers", "Top Performers")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t("score")} &gt; 90%
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                {t("monthlyAssessmentActivity" )}
              </h3>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="assessments"
                      fill="url(#colorUv)"
                      radius={[6, 6, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0.5}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                {t("performanceDistribution" , "Performance Distribution")}
              </h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    {/*  Legend changes based on screen size */}
                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                      }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      formatter={(value, entry, index) => (
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">
                          {value}{" "}
                          <span className="text-gray-900 font-bold">
                            {pieData[index].value}%
                          </span>
                        </span>
                      )}
                    />

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "candidates" && <CandidatesReport />}
      {activeTab === "tests" && <TestPerformance />}
      {activeTab === "trends" && <TimeBasedTrends />}
    </div>
  );
};

export default Reports;
