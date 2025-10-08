import React from "react";
import { FiBarChart2, FiPieChart } from "react-icons/fi";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
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

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

const TestPerformance = () => {
  const { t } = useLanguage();
  
  //  Dummy data with translations
  const monthlyData = [
    { name: t('jan'), assessments: 85 },
    { name: t('feb'), assessments: 92 },
    { name: t('mar'), assessments: 78 },
    { name: t('apr'), assessments: 95 },
    { name: t('may'), assessments: 88 },
    { name: t('jun'), assessments: 102 },
  ];

  const pieData = [
    { name: t('excellent'), value: 25 },
    { name: t('good'), value: 35 },
    { name: t('average'), value: 28 },
    { name: t('belowAverage'), value: 12 },
  ];
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
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    JavaScript Fundamentals
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  45
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  82%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  89%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {t('medium')}
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    React Development
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  32
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  78%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  76%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    {t('hard')}
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    CSS &amp; HTML Basics
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  67
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  91%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  94%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {t('easy')}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TestPerformance;
