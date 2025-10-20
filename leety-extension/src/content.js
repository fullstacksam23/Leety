let newButton = null;

function addButton() {
  const container = document.getElementById("ide-top-btns");

  if (!container) {
    console.error("Could not insert the custom button");
    return;
  }

  const outerDiv = document.createElement("div");
  newButton = outerDiv;
  outerDiv.className = "relative flex rounded bg-fill-tertiary dark:bg-fill-tertiary ml-1.5 overflow-visible ai-agent-guide";

  const innerDiv = document.createElement("div");
  innerDiv.className = "group flex flex-none items-center justify-center hover:bg-fill-quaternary dark:hover:bg-fill-quaternary rounded relative flex cursor-pointer p-2 text-gray-60 dark:text-gray-60";

  innerDiv.setAttribute("aria-label", "LeetlyButton");
  innerDiv.innerHTML = `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      class="h-4 w-4">
        <path 
          fill="#AF52DE" 
          d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>
    </svg>
  `;

  outerDiv.appendChild(innerDiv);
  container.appendChild(outerDiv);
  newButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'openSidePanel' });
    });
}

function getQuestionAndAnswer(){
    const question = document.querySelectorAll('a[href*="/problems/"]')[4].innerText;
    const description = document.querySelector('div[data-track-load="description_content"]').innerText;
    const userAns = document.querySelector("#editor > div.flex.flex-1.flex-col.overflow-hidden.pb-2 > div.flex-1.overflow-hidden > div > div > div.overflow-guard > div.monaco-scrollable-element.editor-scrollable.vs-dark > div.lines-content.monaco-editor-background > div.view-lines.monaco-mouse-cursor-text").innerText;
    return {question, description, userAns};
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.type == "getData"){
        const data = getQuestionAndAnswer();
        sendResponse({data});
    }
    return true;
})
addButton();