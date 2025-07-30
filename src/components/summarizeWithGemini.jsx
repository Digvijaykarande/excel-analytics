export const summarizeWithGemini = async (excelDataText) => {
  const API_KEY = 'AIzaSyD4x9FqziSV6gaXy2haP1TWNCaVYZuf5IE';
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Summarize the following Excel data with bullet points. Highlight key trends or insights in 6-7 concise lines:\n\n${excelDataText}`
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const geminiAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return geminiAnswer?.trim() || "No summary generated.";
  } catch (error) {
    console.error("Error from Gemini:", error);
    return `Error: ${error.message}`;
  }
};
