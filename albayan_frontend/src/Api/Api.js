export const uid = "QUXCQVLBTKHVQI1HBGJHEWFUAHV"
export const BaseUrl = "https://dev-commonmannit.mannit.co/mannit";

export const storedData = sessionStorage.getItem("loginResponse");
export const parsedData = storedData ? JSON.parse(storedData) : null;
export const userInfo = parsedData?.source ? JSON.parse(parsedData.source) : null;

export const clientId = "1324f596430894050a3b53b276fe71203688887d"
export const clientSecret = "EImEnx7Z1evjSlJ78L9vpO_u38lyhTGZg8M9YMqW"
export const text = "https://api.prepai.io/generateQuestionsApi"
export const doc = "https://api.prepai.io/generateQuestionsFromDocumentApi";
export const video = "https://api.prepai.io/generateQuestionsFromVideoApi";
export const topic = "https://api.prepai.io/generateQuestionsFromTopicApi";
export const url = "https://api.prepai.io/generateQuestionsFromURLApi";
export const SuperAdminID = '68b85bb3b0f00665b62481b8'


export const fetchTotalCandidates = async (setTotalCandidates, setLoading) => {
  try {
    setLoading(true);

    const response = await fetch(
      `${BaseUrl}/retrievemulticount?status=Registered&colname=${uid}_Candidates&page=1&limit=100`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          xxxid: uid,
        },
      }
    );

    const data = await response.json();

    // ✅ Extract count from API response
    const registeredCount =
      data?.source?.counts?.find((c) => c.value === "Registered")?.count || 0;

    setTotalCandidates(registeredCount.toLocaleString());
  } catch (err) {
    console.error("Failed to fetch candidates:", err);
    setTotalCandidates("0");
  } finally {
    setLoading(false);
  }
};
