import React, { useEffect, useState, useRef } from "react";
import { BaseUrl, uid, fetchTotalCandidates } from "../Api/Api"; 
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { FaUser, FaUsers, FaChartLine, FaClipboardList,FaChartBar,FaTrophy   } from "react-icons/fa";

const Dashboard = () => {
  const { t } = useLanguage();
  const [totalCandidates, setTotalCandidates] = useState("0");
  const [invitedCandidates, setInvitedCandidates] = useState("0");
  const [recentResults, setRecentResults] = useState([]);
  const [activeAssessments, setActiveAssessments] = useState("0");
  const [dailyChartData, setDailyChartData] = useState([]);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const fetchCalled = useRef(false);

  // Helper to format "x hours/days ago"
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently"; // fallback if missing
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Recently"; // invalid date fallback

    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

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
  const fetchInvitedCandidates = async () => {
    try {
      const response = await fetch(
        `${BaseUrl}/retrievemulticount?inviteStatus=invited&colname=${uid}_Candidates&page=1&limit=100`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );

      const data = await response.json();

      // ✅ Extract count from API response (similar to Registered)
      const invitedCount =
        data?.source?.counts?.find((c) => c.value === "invited")?.count || 0;

      setInvitedCandidates(invitedCount.toLocaleString());
    } catch (err) {
      console.error("Failed to fetch invited candidates:", err);
      setInvitedCandidates("0");
    }
  };

  // ✅ assuming you store token in localStorage

  const fetchActiveAssessments = async () => {
    const token = getToken();
    try {
      let allData = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(
          `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&page=${page}&limit=${limit}`,
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
          allData = allData.concat(data.source);
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      // Process data to extract unique assessments (same logic as AssessmentList)
      const assessmentMap = new Map();

      allData.forEach((item) => {
        try {
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          if (parsed.asnT && Array.isArray(parsed.asnT)) {
            const testNames = parsed.asnT.map(test => test.title).sort().join(', ');
            const assessmentTitle = parsed.assT || 'Untitled Assessment';
            const assessmentKey = `${assessmentTitle}_${testNames}`;

            if (!assessmentMap.has(assessmentKey)) {
              assessmentMap.set(assessmentKey, true);
            }
          }
        } catch (error) {
          console.error("Error processing candidate data:", error);
        }
      });

      // Set the count of unique assessments
      setActiveAssessments(assessmentMap.size.toString());
    } catch (err) {
      console.error("Failed to fetch active assessments:", err);
      setActiveAssessments("0");
    }
  };

  // Fetch daily assessment activity data
  const fetchDailyAssessmentActivity = async () => {
    const token = getToken();
    try {
      // Fetch assessments created (from Candidates collection)
      let candidatesData = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(
          `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&page=${page}&limit=${limit}`,
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
          candidatesData = candidatesData.concat(data.source);
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      // Fetch completions (from Results collection)
      let resultsData = [];
      page = 1;

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
          resultsData = resultsData.concat(parsed);
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      // Process data for last 7 days
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const last7Days = [];

      // Get last 7 days starting from today
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        last7Days.push({
          day: daysOfWeek[date.getDay()],
          date: date,
          nextDate: nextDate,
          assessments: 0,
          completions: 0
        });
      }

      // Count assessments created per day
      candidatesData.forEach((item) => {
        try {
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          if (parsed.updatedAt) {
            let dateStr = parsed.updatedAt;
            if (typeof dateStr === 'object' && dateStr.$date) {
              dateStr = dateStr.$date;
            }
            const itemDate = new Date(dateStr);
            itemDate.setHours(0, 0, 0, 0);

            last7Days.forEach(day => {
              if (itemDate >= day.date && itemDate < day.nextDate) {
                day.assessments++;
              }
            });
          }
        } catch (error) {
          console.error("Error processing candidate data:", error);
        }
      });

      // Count completions per day
      resultsData.forEach((item) => {
        try {
          if (item.testHistory && Array.isArray(item.testHistory)) {
            item.testHistory.forEach(test => {
              if (test.date) {
                const cleanDateStr = test.date.replace("IST", "").trim();
                const itemDate = new Date(cleanDateStr);
                itemDate.setHours(0, 0, 0, 0);

                last7Days.forEach(day => {
                  if (itemDate >= day.date && itemDate < day.nextDate) {
                    day.completions++;
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error("Error processing result data:", error);
        }
      });

      setDailyChartData(last7Days);
    } catch (err) {
      console.error("Failed to fetch daily assessment activity:", err);
    }
  };

  const fetchRecentResults = async () => {
    const token = getToken();
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
        } else break;

        page++;
      }

      // ✅ Sort results by completion date (newest first)
      allData.sort(
        (a, b) =>
          new Date(b?.completedAt || b?.timestamp) -
          new Date(a?.completedAt || a?.timestamp)
      );

      // After fetching allData
      const filteredData = allData.filter(
        (item) =>
          item.personalInformation &&
          Array.isArray(item.testHistory) &&
          item.testHistory.length > 0
      );

  const recent = filteredData.slice(0, 5).map((item) => {
  const candidateName = item.personalInformation?.name || item.name || "Unknown";
  
  // Use top-level score instead of testHistory score
  const scoreValue = parseInt(item.score) || 0;

  return {
    name: candidateName,
    test: item.assT || "Untitled Assessment", // Use assT instead of testName
    score: `${scoreValue}`,
    initials: candidateName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase(),
    color:
      scoreValue >= 90
        ? "bg-green-100 text-green-800"
        : scoreValue >= 75
        ? "bg-blue-100 text-blue-800"
        : "bg-yellow-100 text-yellow-800",
    time: item.testHistory?.[0]?.date
      ? formatTimeAgo(item.testHistory[0].date)
      : "Recently",
  };
});


      setRecentResults(recent);
    } catch (err) {
      console.error("Failed to fetch recent results:", err);
    }
  };

  useEffect(() => {
    if (fetchCalled.current) return;
    fetchCalled.current = true;

    fetchTotalCandidates(setTotalCandidates, setLoading); // ✅ pass state setters
    fetchInvitedCandidates();
    fetchActiveAssessments();
    fetchDailyAssessmentActivity();
    fetchRecentResults();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t("assessmentDashboard")}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {t("comprehensiveCandidateAnalytics")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
        {[
          {
            title: t("totalCandidates"),
            value: loading ? t("loading") : totalCandidates,
            desc: t("registered"),
            subDesc: "",
            iconColor: "bg-blue-50 text-blue-600",
            change: "+12%",
            changeColor: "bg-green-100 text-green-600",
            svg: <FaUsers size={24} />,
          },
          {
            title: t("candidatesInvited"),
            value: loading ? t("loading") : invitedCandidates,
            desc: t("invitationsSent"),
            iconColor: "bg-green-50 text-green-600",
            change: "+8%",
            changeColor: "bg-green-100 text-green-600",
            svg: <FaUser size={24} />, // React Icon
          },
          {
            title: t("activeAssessments"),
            value: loading ? t("loading") : activeAssessments,
            desc: t("currentlyInProgress"),
            iconColor: "bg-purple-50 text-purple-600",
            change: t("active"),
            changeColor: "bg-blue-100 text-blue-600",
           svg: <FaClipboardList size={24} /> // React Icon
          },
          {
            title: t("completionRate"),
            value: "82.5%",
            desc: t("averageCompletion"),
            iconColor: "bg-orange-50 text-orange-600",
            change: "+5.2%",
            changeColor: "bg-green-100 text-green-600",
             svg: <FaChartLine size={24} /> // React Icon
          },
          {
            title: t("averageScore"),
            value: "78.3%",
            desc: t("acrossAllAssessments"),
            iconColor: "bg-indigo-50 text-indigo-600",
            change: "+3.2%",
            changeColor: "bg-green-100 text-green-600",
          svg: <FaChartBar size={24} />
          },
          {
            title: t("topPerformers"),
            value: "156",
            desc: t("scoreGreaterThan90"),
            iconColor: "bg-yellow-50 text-yellow-600",
            change: "+15%",
            changeColor: "bg-green-100 text-green-600",
          svg: <FaTrophy size={24} />
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.iconColor}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide"
                >
                  {stat.svg}
                </svg>
              </div>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${stat.changeColor}`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 font-medium">{stat.title}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity */}
    {/* Left Column - Recent Activity */}
<div className="lg:col-span-2">
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">
      {t("recentAssessmentActivity")}
    </h3>
    <div
      className="space-y-2 max-h-[320px] overflow-y-auto" // scrollable container
    >
      {recentResults.length > 0 ? (
        recentResults.map((item, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4 mb-2 sm:mb-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {item.initials}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{item.test}</p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${item.color}`}
              >
                {item.score}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {item.time.replace("hours ago", t("hoursAgo"))}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center">
          {t("noRecentActivity")}
        </p>
      )}
    </div>
  </div>
</div>


        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Skills Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t("skillsAssessmentOverview")}
            </h3>
            <div className="space-y-4">
              {[
                {
                  skill: "Content Writing",
                  percent: 82,
                  tested: 245,
                  color: "bg-blue-500",
                },
                {
                  skill: "Market Research",
                  percent: 78,
                  tested: 189,
                  color: "bg-blue-500",
                },
                {
                  skill: "Influencer Outreach",
                  percent: 75,
                  tested: 156,
                  color: "bg-blue-500",
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {item.skill}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.percent}%
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("quickActions")}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/candidates")}
                className="w-full flex items-center space-x-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {t("inviteCandidates")}
              </button>
              <button
                onClick={() => navigate("/test-library")}
                className="w-full flex items-center space-x-3 p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                {t("createNewTest")}
              </button>

              <button
                onClick={() => navigate("/reports")}
                className="w-full flex items-center space-x-3 p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                {t("viewReports")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Assessment Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t("dailyAssessmentActivity")}
        </h3>
        <div className="relative h-64 w-full overflow-x-auto">
          <div className="min-w-full">
            <svg
              className="w-full h-64"
              viewBox="0 0 700 250"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y-Axis Lines & Labels */}
              {[0, 20, 40, 60, 80, 100].map((value, i) => (
                <g key={i}>
                  <line
                    x1="50"
                    y1={200 - i * 30}
                    x2="650"
                    y2={200 - i * 30}
                    stroke="#F3F4F6"
                    strokeWidth="1"
                  />
                  <text
                    x="40"
                    y={205 - i * 30}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {value}
                  </text>
                </g>
              ))}

              {/* Bars & Labels */}
              {dailyChartData.map((dayData, index) => {
                const maxValue = Math.max(
                  ...dailyChartData.map(d => Math.max(d.assessments, d.completions)),
                  1
                );
                
                const x = 70 + (index * 80);
                const assessmentHeight = (dayData.assessments / maxValue) * 150;
                const completionHeight = (dayData.completions / maxValue) * 150;
                const assessmentY = 200 - assessmentHeight;
                const completionY = 200 - completionHeight;

                return (
                  <g key={index}>
                    {/* Blue bar - Assessments */}
                    <rect
                      x={x}
                      y={assessmentY}
                      width="30"
                      height={assessmentHeight}
                      fill="#3B82F6"
                      rx="4"
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                    >
                      <title>{`Assessments: ${dayData.assessments}`}</title>
                    </rect>
                    {/* Green bar - Completions */}
                    <rect
                      x={x + 35}
                      y={completionY}
                      width="30"
                      height={completionHeight}
                      fill="#10B981"
                      rx="4"
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                    >
                      <title>{`Completions: ${dayData.completions}`}</title>
                    </rect>
                    {/* Day label */}
                    <text
                      x={x + 30}
                      y="220"
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {dayData.day}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <g>
                <rect
                  x="520"
                  y="10"
                  width="12"
                  height="12"
                  fill="#3B82F6"
                  rx="2"
                />
                <text x="537" y="20" className="text-xs fill-gray-700">
                  {t("assessments")}
                </text>
                <rect
                  x="520"
                  y="28"
                  width="12"
                  height="12"
                  fill="#10B981"
                  rx="2"
                />
                <text x="537" y="38" className="text-xs fill-gray-700">
                  {t("completions")}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
