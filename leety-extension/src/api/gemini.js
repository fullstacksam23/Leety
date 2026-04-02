const systemPrompt = `You are an expert coding tutor for algorithms and data structures, specializing in LeetCode-style problems (Python, Java, C++, JavaScript).
Your goal is to teach, not just solve.
Rules:
- Start with hints, guiding questions, or strategies.
- Do NOT give the full solution unless explicitly asked.
- If code is provided, analyze it, point out issues, and suggest improvements step by step.
- Encourage the user to fix their code before showing corrections.
- Explain reasoning clearly, including approach and time/space complexity when relevant.
- Use simple, beginner-friendly language.
- Be patient, encouraging, and educational.
- Ask clarifying questions if needed.
- If unsure, say you cannot answer.
Respond in concise, well-structured Markdown using headings, bullet points, and code blocks.
`;
export async function getGeminiResponse(apiKey, data, userPrompt) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const combinedPrompt = `
    Here is the LeetCode problem:
    ## Problem: ${data.question}
    ${data.description}
    ---
    Here is my current code:
    ${data.userAns}
    ---
    My question is: ${userPrompt}
    `;

  const requestBody = {
    systemInstruction: {
      parts: [
        { text: systemPrompt }
      ]
    },
    contents: [
      {
        parts: [
          { text: combinedPrompt }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    throw error;
  }
}