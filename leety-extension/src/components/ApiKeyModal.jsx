import { useState } from "react";

export default function ApiKeyModal({ onSuccess }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!key.trim()) return;

    setLoading(true);
    setError("");

    // 1️⃣ Verify API key
    chrome.runtime.sendMessage(
      { type: "verifyApiKey", apiKey: key.trim() },
      (res) => {
        if (!res?.success) {
          setError("Invalid API key");
          setLoading(false);
          return;
        }

        // 2️⃣ Save API key
        chrome.runtime.sendMessage(
          { type: "saveApiKey", apiKey: key.trim() },
          () => {
            setLoading(false);
            onSuccess();
          }
        );
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-xl w-[90%] max-w-md">
        <h2 className="text-lg font-semibold mb-2">Set Gemini API Key</h2>
        <p className="text-sm text-gray-400 mb-3">
            Get your API key from{" "}
            <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
            >
                Google AI Studio
            </a>
            .
        </p>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste your API key"
          className="w-full bg-slate-800 p-3 rounded-lg mb-2 focus:outline-none"
        />

        {error && (
          <p className="text-red-400 text-sm mb-2">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-slate-700 rounded-lg"
            onClick={onSuccess}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-emerald-500 rounded-lg text-black"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
