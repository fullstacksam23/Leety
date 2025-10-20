import React, { useState, useEffect, useRef } from 'react';
import showdown from 'showdown';

// Initialize the markdown converter with some options
const converter = new showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
  simpleLineBreaks: true
});

function App() {
  // State for managing the API key and modal
  const [apiKey, setApiKey] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // State for managing chat messages and user input
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  
  // Ref to control the scrolling of the chat area
  const chatAreaRef = useRef(null);

  // --- Effects ---

  // On component mount, check if an API key is already stored
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "getApiKey" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        setIsModalOpen(true);
      } else if (response && response.apiKey) {
        setApiKey(response.apiKey);
        setIsModalOpen(false);
      } else {
        setIsModalOpen(true);
      }
    });
  }, []);
  
  // Whenever new messages are added, scroll to the bottom of the chat
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Handler Functions ---

  // Handles verifying and saving the API key
  const handleSaveApiKey = async () => {
    const keyToVerify = document.getElementById('api-key-input')?.value;
    if (!keyToVerify) {
      setModalError('Please enter an API key.');
      return;
    }
    setIsVerifying(true);
    setModalError('');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'verifyApiKey', apiKey: keyToVerify });
      if (chrome.runtime.lastError) throw new Error(chrome.runtime.lastError.message);
      
      if (response && response.success) {
        await chrome.runtime.sendMessage({ type: 'saveApiKey', apiKey: keyToVerify });
        if (chrome.runtime.lastError) throw new Error(chrome.runtime.lastError.message);
        setApiKey(keyToVerify);
        setIsModalOpen(false);
      } else {
        setModalError('Invalid API Key. Please check and try again.');
      }
    } catch (error) {
      console.error('Error verifying API key:', error);
      setModalError(`An error occurred: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handles sending a user's message to the backend
  const handleSendMessage = async () => {
      if (!userInput.trim()) return;

      // Add user message to the chat and clear input
      setMessages(prev => [...prev, { sender: 'user', text: userInput, isHtml: false }]);
      const currentPrompt = userInput;
      setUserInput('');

      // Add a temporary loading message for the bot
      setMessages(prev => [...prev, { sender: 'bot', text: '...', isHtml: false, id: Date.now() }]);
      const loadingMessageId = Date.now();


      try {
          const response = await chrome.runtime.sendMessage({ type: "chat", userPrompt: currentPrompt });
          if (chrome.runtime.lastError) throw new Error(chrome.runtime.lastError.message);

          const botResponse = response.error ? `<p class="text-red-500">${response.error}</p>` : converter.makeHtml(response.output);
          
          setMessages(prev => prev.map(msg => 
            (msg.text === '...') ? { ...msg, text: botResponse, isHtml: true } : msg
          ));

      } catch (error) {
           setMessages(prev => prev.map(msg => 
            (msg.text === '...') ? { ...msg, text: `<p class="text-red-500">Error: ${error.message}</p>`, isHtml: true } : msg
          ));
      }
  };

  // Handles the 'Enter' key press in the textarea
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
    }
  };
  
  // Tailwind classes for styling markdown content from showdown
  const botMessageStyles = `
    prose prose-invert prose-sm max-w-none 
    prose-p:m-0 prose-headings:my-2 
    prose-ul:my-2 prose-ol:my-2 prose-li:my-0 
    prose-pre:bg-gray-800 prose-pre:p-3 prose-pre:rounded-md 
    prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
  `;

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg text-center w-[90%] max-w-md shadow-lg text-gray-800">
            <h2 className="text-2xl font-bold mb-2">Enter Your Gemini API Key</h2>
            <p className="text-gray-600 mb-4">Get a key from Google AI Studio to use this extension.</p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors mb-4">
              Get API Key
            </a>
            <div className="flex flex-col gap-2">
              <input
                type="password"
                id="api-key-input"
                placeholder="Paste your API key here"
                className="p-2 border border-gray-300 rounded-md w-full"
                onKeyDown={(e) => { if(e.key === 'Enter') handleSaveApiKey()}}
              />
              <button onClick={handleSaveApiKey} disabled={isVerifying} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isVerifying ? 'Verifying...' : 'Save & Verify'}
              </button>
            </div>
            <p className="text-red-500 mt-2 h-5">{modalError}</p>
          </div>
        </div>
      )}

      <div className={`flex flex-col h-screen w-full bg-gray-800 text-gray-200 ${isModalOpen ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="flex-grow flex flex-col p-4 overflow-y-auto gap-4" ref={chatAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center m-auto">
              <span className="text-5xl">👋</span>
              <p className="text-gray-400">Welcome to Leety! How can I help you today?</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[85%] break-words ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                      {msg.isHtml ? (
                          <div className={botMessageStyles} dangerouslySetInnerHTML={{ __html: msg.text }} />
                      ) : (
                          <p>{msg.text}</p>
                      )}
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 bg-gray-900 border-t border-gray-700">
          <textarea
            className="w-full bg-gray-700 text-white p-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask a question..."
            rows="1"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
          ></textarea>
        </div>
      </div>
    </>
  );
}

export default App;