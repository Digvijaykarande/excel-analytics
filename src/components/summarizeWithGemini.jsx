export const summarizeWithGemini = async (excelDataText) => {
  const API_KEY = "AIzaSyD4x9FqziSV6gaXy2haP1TWNCaVYZuf5IE";
  const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Please provide a detailed summary of the following Excel data:\n${excelDataText}\n\nInclude key trends, patterns, and important insights in bullet points.make it in 4-5 lines`
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Gemini response");
    }

    const data = await response.json();
    const geminiAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return geminiAnswer || "No summary generated.";
  } catch (error) {
    console.error("Error from Gemini:", error);
    return `Error: ${error.message}`;
  }
};
