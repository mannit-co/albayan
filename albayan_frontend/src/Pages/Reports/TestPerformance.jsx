import React, { useState, useEffect } from "react";
import { FiBarChart2, FiPieChart } from "react-icons/fi";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useLanguage } from "../../contexts/LanguageContext";
import { uid,BaseUrl } from "../../Api/Api";

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

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#E75480"]; // Green, Blue, Orange, Gray

const TestPerformance = ({ selectedDays = "7d" }) => {
  const { t } = useLanguage();
  const [pieData, setPieData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [testPerformanceData, setTestPerformanceData] = useState([]);

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
        const currentMonth = new Date().getMonth();
        
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

      // Process test performance overview
      if (data.testPerformanceOverview) {
        setTestPerformanceData(data.testPerformanceOverview);
      }
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(selectedDays);
  }, [selectedDays]);
  return (
    <div className="space-y-6">
      {/* Row with Bar & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t('monthlyAssessmentActivity')}
          </h3>
          <div className="h-64">
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
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
      {/* Pie Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                    {t('performanceDistribution')}
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

        {/* Test Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FaCheckCircle className="text-green-600" /> {t('testPerformanceOverview')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('testName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('participants')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('averageScore',"Average Score")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('completionRate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('difficulty')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testPerformanceData.length > 0 ? (
                testPerformanceData.map((test, index) => {
                  const difficulty = test.Difficulty;
                  let difficultyLabel = t('medium');
                  let difficultyColor = 'bg-yellow-100 text-yellow-800';
                  
                  if (difficulty < 50) {
                    difficultyLabel = t('easy');
                    difficultyColor = 'bg-green-100 text-green-800';
                  } else if (difficulty > 75) {
                    difficultyLabel = t('hard');
                    difficultyColor = 'bg-red-100 text-red-800';
                  }

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {test.testName || test._id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.Participants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.AverageScore.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.CompletionRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${difficultyColor}`}>
                          {difficultyLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {t('noDataAvailable')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TestPerformance;
