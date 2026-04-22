export const summarizeWithGemini = async (excelDataText) => {
  try {
    const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Currently recommended Groq model
          messages: [
            {
              role: "user",
              content: `Summarize the following Excel data with bullet points. Highlight key trends or insights in 6-7 concise lines:\n\n${excelDataText}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    
    return (
      data?.choices?.[0]?.message?.content ||
      "No summary generated."
    );
  } catch (error) {
    console.error(error);
    return `Error: ${error.message}`;
  }
};