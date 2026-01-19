# Leety

**Leety** is an AI-powered, chat-based Chrome extension that acts as a coding tutor for LeetCode problems.  
It helps you **understand, debug, and improve your solutions step by step**.


---

## Features

- **Code Analysis** – Analyze your current solution and identify bugs, inefficiencies, and logical errors  
- **Edge Case Detection** – Automatically highlight missed edge cases and boundary conditions  
- **Step-by-step Explanations** – Learn the logic, approach, and reasoning behind solutions  
- **Time & Space Complexity** – Automatic complexity analysis  
- **Chatbot-style UI** – Clean, readable responses with syntax-highlighted code blocks  
- **User-owned API Key** – Uses your own Gemini API key (stored locally in your browser)  


---

## How It Works

1. Open a LeetCode problem
2. Click the **Leety** button in the editor toolbar to open the sidepanel
3. Ask questions like:
   - *“Explain my code”*
   - *“What’s wrong with this approach?”*
   - *“How can I optimize this?”*

*(Leety only gives full solutions if you explicitly ask)*

---
## Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/leety.git
   cd Leety/leety-extension
2. Install dependencies:
    `npm install`
3. Build the extension:
    `npm run build` (This creates a dist folder)
4. Load into Chrome:

    - Go to chrome://extensions

    - Enable Developer mode

    - Click Load unpacked

    - Select the dist/ folder

## API Key Setup

Leety requires a **Google Gemini API key**.

- Get one from: https://aistudio.google.com/app/apikey  
- Enter the key in Leety when prompted  
- The key is stored **locally** in your browser  


## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Chrome APIs:** Side Panel, Content Scripts, Storage
- **AI:** Google Gemini API
- **Markdown Rendering:** `react-markdown`
- **Syntax Highlighting:** `react-syntax-highlighter`

![Leety Extension Demo](leety-extension/src/assets/leetyDemo3.gif)








---
## License
>You can check out the full license [here](https://github.com/fullstacksam23/Leety/blob/main/LICENSE)

This project is licensed under the terms of the **MIT** license.

