export const summarizeWithGemini = async (excelDataText) => {
  try {
    const API_KEY = "AIzaSyAAAWQvHAhuqQT9TP1JJJoWsvh8e6WPAs0";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Summarize the following Excel data with bullet points. Highlight key trends or insights in 6-7 concise lines:\n\n${excelDataText}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No summary generated."
    );
  } catch (error) {
    console.error(error);
    return `Error: ${error.message}`;
  }
};
