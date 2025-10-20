const systemPrompt = `You are an expert coding tutor specialized in algorithms, data structures, and solving LeetCode-style programming problems in Python, Java, C++, and JavaScript. Your main goal is to teach and guide the user to solve problems, rather than just giving the solution. Follow these rules:
   - When a user asks about a problem, first provide hints, guiding questions, or strategies to help them think critically.  
   - Only provide the full solution if the user explicitly asks for it.
   - If the user shares code, analyze it, point out mistakes or inefficiencies, and suggest improvements step by step.  
   - Encourage the user to try fixing their code themselves before showing the corrected version.
   - Explain your reasoning clearly, step by step. Include the algorithm approach, data structures used, and time/space complexity if relevant.  
   - Use simple, beginner-friendly language if needed.
   - Be encouraging, patient, and educational. Avoid giving away answers immediately.  
   - Ask clarifying questions if the problem statement or user code is unclear. 
   - If uncertain, say that you are unable to anwer the question.
Your ultimate goal is to help the user learn, debug, and solve coding problems effectively, while fostering independent problem-solving skills.
`;
async function getGeminiResponse(apiKey, data, userPrompt) {
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


async function verifyApiKey(apiKey) {
    // Using a lightweight endpoint to check for validity.
    const url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1";
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'x-goog-api-key': apiKey },
        });
        return response.ok;
    } catch (error) {
        console.error("API Key verification network error:", error);
        return false;
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getApiKey') {
      chrome.storage.local.get(['apiKey'], (result) => {
          sendResponse({ apiKey: result.apiKey });
      });
      return true;
  }
  
  if (message.type === 'saveApiKey') {
      chrome.storage.local.set({ apiKey: message.apiKey }, () => {
          sendResponse({ success: true });
      });
      return true;
  }
  
  if (message.type === 'verifyApiKey') {
      (async () => {
          const isValid = await verifyApiKey(message.apiKey);
          sendResponse({ success: isValid });
      })();
      return true;
  }

  if (message.type === 'openSidePanel') {
    if (sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    }
  } 
  else if (message.type === 'chat') {
    (async () => {
      //get apiKey from storage
      const { apiKey } = await chrome.storage.local.get(['apiKey']);
      if (!apiKey) {
        sendResponse({ output: "Error: API Key is not set. Please add your key in the side panel." });
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        sendResponse({ output: "Error: No active tab found." });
        return;
      }

      try {
        const dataResponse = await chrome.tabs.sendMessage(tab.id, { type: "getData" });
        if (dataResponse && dataResponse.data) {
          //Pass the apiKey to the geminiResponse function
          const output = await getGeminiResponse(apiKey, dataResponse.data, message.userPrompt);
          sendResponse({ output: output.candidates[0].content.parts[0].text });
        } else {
          sendResponse({ output: "Error: Received no data from content script." });
        }
      } catch (e) {
        console.error("Error during chat processing:", e);
        sendResponse({ output: `An error occurred. Please ensure your API Key is valid and has access to the Gemini API. Error: ${e.message}` });
      }
    })();
    return true; 
  }
});
