import React, { useEffect, useRef, useState } from "react";
import { SpinnerDiamond } from "spinners-react";
import { getGeminiResponse } from "./api/gemini";
import Message from "./components/Message";
import PromptPresets from "./components/PromptPreset";
import ApiKeyModal from "./components/ApiKeyModal";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const [showPresets, setShowPresets] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);


  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

const sendMessage = async (customPrompt) => {
  const finalPrompt = customPrompt ?? input;

  if (!finalPrompt.trim() || loading) return;

  setShowPresets(false); // hide presets permanently

  setInput("");
  setMessages((m) => [...m, { sender: "user", text: finalPrompt }]);
  setLoading(true);

  try {
    const pageResponse = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "getPageContent" }, (res) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(res);
      });
    });
    let text;

    if(pageResponse?.error === "ApiKeyMissing"){
      text = "Please add your API Key first";
      setShowApiKeyModal(true);
      setLoading(false);
      return;

    }
    else{
    const gemini = await getGeminiResponse(
      pageResponse.apiKey,
      pageResponse.dataResponse.data,
      finalPrompt
    );

    text =
      gemini?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response received.";
    }


    setMessages((m) => [...m, { sender: "bot", text }]);
  } catch (err) {
    setMessages((m) => [
      ...m,
      { sender: "bot", text: err?.message || "Something went wrong." },
    ]);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex flex-col h-screen bg-slate-950 text-gray-200">
          {showApiKeyModal && (
      <ApiKeyModal onSuccess={() => setShowApiKeyModal(false)} />
    )}
<div className="flex flex-1 overflow-hidden">
  {/* Chat area */}
  <div
    ref={chatRef}
    className="flex-1 overflow-y-auto p-4 space-y-4"
  >
    {messages.length === 0 && !loading && (
      <div className="text-center text-gray-400 mt-24">
        Ask anything about the LeetCode problem
      </div>
    )}

    {messages.map((msg, i) => (
      <Message key={i} {...msg} />
    ))}

    {loading && (
      <div className="flex justify-start">
        <div className="bg-gray-800 p-3 rounded-xl">
          <SpinnerDiamond size={30} color="#3b82f6" />
        </div>
      </div>
    )}
  </div>

    {showPresets && (
      <PromptPresets
        floating
        onSelect={(prompt) => {
          sendMessage(prompt);
        }}
      />
    )}

</div>

      <div className="border-t border-slate-800 bg-slate-900 p-3 flex gap-2">
        <textarea
          rows="1"
          className="flex-1 bg-slate-800 rounded-xl p-3 resize-none focus:outline-none text-gray-100 placeholder-gray-400"
          placeholder="Shift+Enter to insert a line break."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (showPresets) setShowPresets(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-emerald-500 px-4 rounded-xl hover:bg-emerald-600 disabled:bg-slate-600 text-black font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
