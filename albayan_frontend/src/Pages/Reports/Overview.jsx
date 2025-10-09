import React, { useState ,useEffect} from "react";
import {
  FiDownload,
  FiBarChart2,
  FiUsers,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";
import { FaCheckCircle, FaMedal } from "react-icons/fa";
import { BaseUrl, uid } from "../../Api/Api";
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
const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#E75480"]; // Green, Blue, Orange, Gray

const Reports = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  // 👇 New states
  const [totalCandidates, setTotalCandidates] = useState("0");
  const [completedTests, setCompletedTests] = useState("0");
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState("7d");
  const [apiData, setApiData] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [averageCompletion, setAverageCompletion] = useState("0");
  const [averageScore, setAverageScore] = useState("0");
  const [topPerformers, setTopPerformers] = useState("0");

  // Retrieve token from sessionStorage
  const getToken = () => {
    let token = null;
    const storedData = sessionStorage.getItem("loginResponse");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.source) {
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
      }
    }
    if (!token) {
      console.error("Token not found");
    }
    return token;
  };

  // Fetch average score and top performers
  const fetchAverageAndTop = async () => {
    try {
      const response = await fetch(
        `${BaseUrl}/getD`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );

      const data = await response.json();
      if (data["Average Score (Last 6 Months)"] !== undefined) {
        setAverageScore(data["Average Score (Last 6 Months)"].toString());
      }
      if (data["Top Performers (Last 6 Months)"]) {
        setTopPerformers(data["Top Performers (Last 6 Months)"].length.toString());
      }
    } catch (err) {
      console.error("Failed to fetch average and top performers:", err);
    }
  };

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
      setApiData(data);

      // Process performance distribution for pie chart
      if (data.performanceDistribution) {
        const perfDist = data.performanceDistribution;
        const newPieData = [
          { name: t('average'), value: perfDist["Average (70-79%)"] || 0 },
          { name: t('belowAverage'), value: perfDist["Below Average (<70%)"] || 0 },
          { name: t('excellent'), value: perfDist["Excellent (90-100%)"] || 0 },
          { name: t('good'), value: perfDist["Good (80-89%)"] || 0 },
        ];
        setPieData(newPieData);
      }

      // Process monthly assessment activity for bar chart (last 6 months)
      if (data.monthlyAssessmentActivity) {
        const monthlyActivity = data.monthlyAssessmentActivity;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth(); // 0-11
        
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const monthName = monthNames[monthIndex];
          const monthKey = monthName.toUpperCase();
          
          last6Months.push({
            name: t(monthName.toLowerCase()),
            assessments: monthlyActivity[monthKey] || 0
          });
        }
        
        setMonthlyData(last6Months);
      }

      // Calculate average completion rate
      if (data.testPerformanceOverview) {
        let totalAssigned = 0;
        let totalCompleted = 0;
        data.testPerformanceOverview.forEach(test => {
          totalAssigned += test.Participants;
          totalCompleted += (test.CompletionRate / 100) * test.Participants;
        });
        const avgCompletion = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
        setAverageCompletion(avgCompletion.toFixed(1));
      }
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    }
  };

  // Fetch total candidates with distinct emails
  const fetchTotalCandidatesDistinct = async () => {
    const token = getToken();
    try {
      let allEmails = new Set();
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(
          `${BaseUrl}/auth/retrievecollection?distinct_field=email&ColName=${uid}_Candidates&page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              xxxid: uid,
            },
          }
        );

        const data = await response.json();
        if (data?.source && Array.isArray(data.source)) {
          data.source.forEach(email => allEmails.add(email));
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      setTotalCandidates(allEmails.size.toString());
    } catch (err) {
      console.error("Failed to fetch total candidates:", err);
      setTotalCandidates("0");
    }
  };

  // Fetch completed tests count
  const fetchCompletedTests = async () => {
    const token = getToken();
    if (!token) return;

    try {
      let allData = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(
          `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Result&page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              xxxid: uid,
            },
          }
        );

        const data = await response.json();
        if (data?.source && Array.isArray(data.source)) {
          const parsed = data.source.map((item) => JSON.parse(item));
          allData = allData.concat(parsed);
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      // Count all testHistory entries
      let testHistoryCount = 0;
      allData.forEach((item) => {
        if (item.testHistory && Array.isArray(item.testHistory)) {
          testHistoryCount += item.testHistory.length;
        }
      });

      setCompletedTests(testHistoryCount.toString());
    } catch (err) {
      console.error("Failed to fetch completed tests:", err);
      setCompletedTests("0");
    }
  };

  useEffect(() => {
    fetchTotalCandidatesDistinct();
    fetchCompletedTests();
    fetchAnalyticsData(selectedDays);
    fetchAverageAndTop();
  }, []);

  useEffect(() => {
    fetchAnalyticsData(selectedDays);
  }, [selectedDays]);
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
            <select 
              value={selectedDays}
              onChange={(e) => setSelectedDays(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="7d">{t('last7Days')}</option>
              <option value="30d">{t('last30Days')}</option>
              <option value="90d">{t('last90Days')}</option>
              <option value="1y">{t('lastYear')}</option>
            </select>
            {/* <button className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <FiDownload size={16} />
              <span>{t('export')}</span>
            </button> */}
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
                {loading ? "Loading..." : completedTests}
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
                {loading ? "Loading..." : `${averageScore}%`}
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                {t("averageScore")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t("Across all test")}
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
                {loading ? "Loading..." : topPerformers}
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                {t("topPerformers", "Top Performers")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t("Score > 90%")}
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
                            {entry.value}%
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
      {activeTab === "tests" && <TestPerformance selectedDays={selectedDays} />}
      {activeTab === "trends" && <TimeBasedTrends selectedDays={selectedDays} />}
    </div>
  );
};

export default Reports;
