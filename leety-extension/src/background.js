

async function updateSidePanel(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) {
      // Disable for tabs with no URL (e.g., new tab page)
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: false
      });
      return;
    }

    if (tab.url.startsWith("https://leetcode.com/problems/")) {
      // Enable the side panel for LeetCode tabs
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        path: "index.html", // Set the path for this tab
        enabled: true
      });
    } else {
      // Disable the side panel for all other tabs
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: false
      });
    }
  } catch (error) {
    console.error(`Error updating side panel for tab ${tabId}:`, error);
  }
}

// When a tab is updated (e.g., user navigates to a new page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We only need to run this when the URL changes or the page is fully loaded
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateSidePanel(tabId);
  }
});

// When the user switches to a different active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateSidePanel(activeInfo.tabId);
});

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
  else if (message.type === 'getPageContent') {
    (async () => {
      //get apiKey from storage
      const { apiKey } = await chrome.storage.local.get(['apiKey']);
      if (!apiKey) {
        sendResponse({ error: "ApiKeyMissing" });
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        sendResponse({ error: "Error: No active tab found." });
        return;
      }

      try {
        const dataResponse = await chrome.tabs.sendMessage(tab.id, { type: "getData" });
        if (dataResponse && dataResponse.data) {
          // //Pass the apiKey to the geminiResponse function
          // const output = await getGeminiResponse(apiKey, dataResponse.data, message.userPrompt);
          // output: output.candidates[0].content.parts[0].text
          sendResponse({ apiKey, dataResponse });
        } else {
          console.log("Error: Received no data from content script.")
          sendResponse({ error: "Error: Received no data from content script." });
        }
      } catch (e) {
        console.error("Error during chat processing:", e);
        sendResponse({ error: `An error occurred. Please ensure your API Key is valid and has access to the Gemini API. Error: ${e.message}` });
      }
    })();
    return true; 
  }
});
