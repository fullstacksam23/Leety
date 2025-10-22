import React, { useState, useEffect, useRef } from 'react';
import showdown from 'showdown';
import { SpinnerDiamond } from 'spinners-react';

// Initialize the markdown converter
const converter = new showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
  simpleLineBreaks: true,
  ghCompatibleHeaderId: true,
  openLinksInNewWindow: true,
  emoji: true,
  underline: true,
  simplifiedAutoLink: true,
});

// --- Custom CodeBlock Component ---
function CodeBlock({ rawCode }) {
  const [isCopied, setIsCopied] = useState(false);

  const lines = rawCode.trim().split('\n');
  const header = lines[0] || '';
  const lang = header.replace('```', '').trim();
  const code = lines.slice(1, -1).join('\n');

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy code: ', err));
  };

  return (
    <div className="bg-gray-950 rounded-lg overflow-hidden my-4 border border-gray-700">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800">
        <span className="text-gray-400 text-sm font-mono">{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          {isCopied ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 4h8a2 2 0 002-2V8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto text-gray-200">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
    </div>
  );
}

// --- Custom BotMessage Component ---
function BotMessage({ text, converter, botMessageStyles }) {
  const parts = text.split(/(```[\w\d]*\n[\s\S]*?\n```)/g);

  return (
    <div>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          return <CodeBlock key={index} rawCode={part} />;
        }
        if (part.trim()) {
          return (
            <div
              key={index}
              className={botMessageStyles}
              dangerouslySetInnerHTML={{ __html: converter.makeHtml(part) }}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isBotReplying, setIsBotReplying] = useState(false);

  const chatAreaRef = useRef(null);

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

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isBotReplying]);

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

  const handleSendMessage = async () => {
    if (!userInput.trim() || isBotReplying) return;

    const currentPrompt = userInput;
    setMessages(prev => [...prev, { sender: 'user', text: currentPrompt }]);
    setUserInput('');
    setIsBotReplying(true);

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "chat", userPrompt: currentPrompt }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response.error) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `<p class="text-red-500">${response.error}</p>`,
          isHtml: true
        }]);
      } else {
        const botResponse = response.output || 'No response received from the server.';
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: botResponse,
          isMarkdown: true
        }]);
      }

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `<p class="text-red-500">Error: ${error.message}</p>`,
        isHtml: true
      }]);
    } finally {
      setIsBotReplying(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const botMessageStyles = `
    prose prose-invert prose-md max-w-none 
    prose-headings:font-bold prose-headings:text-gray-100 prose-headings:mt-4 prose-headings:mb-2
    prose-p:leading-relaxed prose-p:text-gray-200 prose-p:my-2
    prose-ul:list-disc prose-ul:pl-6 prose-ul:my-2 prose-ul:text-gray-200
    prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-2 prose-ol:text-gray-200
    prose-li:my-1
    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300 prose-blockquote:my-2
    prose-table:border-collapse prose-table:my-2
    prose-th:bg-gray-700 prose-th:text-gray-100 prose-th:p-2 prose-th:border prose-th:border-gray-600
    prose-td:p-2 prose-td:border prose-td:border-gray-600 prose-td:text-gray-200
    prose-a:text-blue-400 prose-a:underline prose-a:hover:text-blue-300
    prose-strong:font-bold prose-strong:text-gray-100
    prose-em:italic prose-em:text-gray-200
    prose-img:rounded-lg prose-img:my-2 prose-img:max-w-full
  `;

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl text-center w-[90%] max-w-md shadow-2xl text-gray-200">
            <h2 className="text-2xl font-bold mb-3 text-white">Enter Your Gemini API Key</h2>
            <p className="text-gray-400 mb-4">Get a key from Google AI Studio to use this extension.</p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-4"
            >
              Get API Key
            </a>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                id="api-key-input"
                placeholder="Paste your API key here"
                className="p-3 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if(e.key === 'Enter') handleSaveApiKey() }}
              />
              <button 
                onClick={handleSaveApiKey} 
                disabled={isVerifying} 
                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : 'Save & Verify'}
              </button>
            </div>
            <p className="text-red-400 mt-3 h-5">{modalError}</p>
          </div>
        </div>
      )}

      <div className={`flex flex-col h-screen w-full bg-gray-900 text-gray-200 ${isModalOpen ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="flex-grow flex flex-col p-4 sm:p-6 overflow-y-auto gap-4" ref={chatAreaRef}>
          {messages.length === 0 && !isBotReplying ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center m-auto">
              <span className="text-5xl animate-bounce">🤖</span>
              <p className="text-gray-400 text-lg">Welcome to Leety! Ask me anything to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                >
                  <div className={`p-4 rounded-2xl max-w-[80%] sm:max-w-[70%] break-words shadow-md ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'} ${msg.sender === 'bot' ? 'p-0' : 'p-4'}`}>
                    <div className={`${msg.sender === 'user' ? '' : 'p-4'}`}>
                      {msg.isHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                      ) : msg.isMarkdown ? (
                        <BotMessage 
                          text={msg.text} 
                          converter={converter} 
                          botMessageStyles={botMessageStyles}
                        />
                      ) : (
                        <p className="leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isBotReplying && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-gray-800">
                    <SpinnerDiamond 
                      size={32} 
                      thickness={103} 
                      speed={100} 
                      color="rgba(59, 130, 246, 1)" 
                      secondaryColor="rgba(59, 130, 246, 0.5)" 
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 bg-gray-950 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <textarea
              className="w-full bg-gray-800 text-gray-200 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ask a question..."
              rows="1"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBotReplying}
            ></textarea>
            <button
              onClick={handleSendMessage}
              disabled={isBotReplying || !userInput.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
        `}
      </style>
    </>
  );
}

export default App;
