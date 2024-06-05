const responseDiv = document.getElementById('response');
const chatContainer = document.getElementById('chat-container');
const form = document.getElementById('completion-form');
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generate-btn');
const resetBtn = document.getElementById('reset-btn');
const configBtn = document.getElementById('config-btn');
const configModal = document.getElementById('config-modal');
const cancelConfigBtn = document.getElementById('cancel-config');

let abortController = null;

var converter = new showdown.Converter();

// Load messages from localStorage
document.addEventListener('DOMContentLoaded', () => {
  const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

  if (messages.length > 1) {
    resetBtn.classList.remove('hidden');
  }else{
    messages.push({
      role: 'assistant',
      content: 'How can I help you today? 🤖',
      id: 'init0000'
    })
  }
  messages.forEach(msg => addMessage(msg.content, msg.role, msg.id));
});

// Save messages to localStorage, removing a specific message if needed
const saveMessage = (content, role, id) => {
  const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

  // Remove the message with the specified ID if it exists
  const indexToRemove = messages.findIndex(msg => msg.id === "init0000");
  if (indexToRemove !== -1) {
    messages.splice(indexToRemove, 1);
  }

  // Add the new message
  messages.push({ content, role, id });

  // Save the updated messages to localStorage
  localStorage.setItem('chatMessages', JSON.stringify(messages));
  resetBtn.classList.remove('hidden');
};

// Add message to chat
const addMessage = (content, role, id) => {
  let messageDiv = document.querySelector(`.message[data-id="${id}"]`);
  if (!messageDiv) {
    messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.setAttribute('data-id', id);
    responseDiv.appendChild(messageDiv);
  }
  messageDiv.innerHTML = parseMarkdown(content);
  // chatContainer.scrollTop = chatContainer.scrollHeight;

  manageScrollButton();

  hljs.highlightAll();
};

// Function to manage the scroll button visibility and click event
const manageScrollButton = () => {
  const scrollButton = document.querySelector('#scrollDown');

  // Check if the chat container has enough content to scroll
  if (chatContainer.scrollHeight > chatContainer.clientHeight) {
    // Check if the user is at the bottom of the scroll
    if (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight) {
      // Hide the button by adding the 'hidden' class
      scrollButton.classList.add('hidden');

      // Remove the click event listener
      scrollButton.removeEventListener('click', scrollButton.click);
    } else {
      // Show the button by removing the 'hidden' class
      scrollButton.classList.remove('hidden');

      // Add click event listener to scroll to the bottom of the chat container
      scrollButton.addEventListener('click', () => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  } else {
    // Hide the button by adding the 'hidden' class
    scrollButton.classList.add('hidden');

    // Remove the click event listener
    scrollButton.removeEventListener('click', scrollButton.click);
  }
};

chatContainer.addEventListener('scroll', () => {
  const scrollButton = document.querySelector('#scrollDown');

  // Check if the user is at the bottom of the scroll
  if (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight) {
    // Hide the button by adding the 'hidden' class
    scrollButton.classList.add('hidden');

    // Remove the click event listener
    scrollButton.removeEventListener('click', scrollButton.click);
  } else {
    // Show the button by removing the 'hidden' class
    scrollButton.classList.remove('hidden');

    // Add click event listener to scroll to the bottom of the chat container
    scrollButton.addEventListener('click', () => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  }
});

// Parse Markdown to HTML, handling code blocks
const parseMarkdown = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let result = '';
    let lastIndex = 0;
  
    while ((match = codeBlockRegex.exec(text)) !== null) {
      result += text.substring(lastIndex, match.index);
      const language = match[1] ? ` class="language-${match[1]}"` : '';
      const codeContent = match[2];
      const codeElement = `<pre><button class="copy-code" data-clipboard-target="#code${lastIndex}"><i class="fas fa-clipboard"></i> Copiar</button><code${language} id="code${lastIndex}">${escapeHtml(codeContent)}</code></pre>`;
      result += codeElement;
      lastIndex = codeBlockRegex.lastIndex;
    }
    result += converter.makeHtml(text.substring(lastIndex));
    return result;
};

// Escape HTML characters
const escapeHtml = (unsafe) => {
  return unsafe.replace(/[&<"']/g, (match) => {
    const escape = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return escape[match];
  });
};

// Generate a unique ID
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

let modelSelect = document.getElementById('model-select');

fetch('/api/models')
 .then(response => response.json())
 .then(data => {
    const models = data.models;
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      // limit the size of the model name to 20 characters
      option.text = model.name.length > 20 ? model.name.substring(0, 20) + '...' : model.name;
      modelSelect.appendChild(option);
    });
    // select the first model as default
    modelSelect.value = models[0].name;
    return models;
  })
  .then(models => {
      // Handle form submission
      form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const prompt = promptInput.value;
        if (!prompt.trim()) return;
      
        modelSelect = document.getElementById('model-select');
      
        if (!modelSelect.value) {
          powAlert({ 
            color: 'error', 
            title: 'Error!', 
            text: 'Could not get the list of templates!<br>See if the Ollama server is running!', 
            position: 'topRight' 
          });
        }
      
        const userId = generateId();
        addMessage(prompt, 'user', userId);
        saveMessage(prompt, 'user', userId);
        promptInput.value = '';
        promptInput.setAttribute('disabled', true);
        generateBtn.innerHTML = '<i class="fas fa-stop"></i>';
        generateBtn.classList.remove('bg-blue-500');
        generateBtn.classList.add('bg-red-500');
      
        if (abortController) {
          abortController.abort();
        }
      
        abortController = new AbortController();
      
        let botMessage = '';
        const botId = generateId();
        addMessage('', 'assistant', botId);
        document.querySelector(`.message[data-id="${botId}"]`)
        .innerHTML = `<img src="./assets/img/loading.gif" width="20" height="20">`;
      
        let config = JSON.parse(localStorage.getItem('config')) || [];
        let messages = JSON.parse(localStorage.getItem('chatMessages')) || [{role: 'user', content: prompt}];
      
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelSelect.value,
              messages,
              ...config
            }),
            signal: abortController.signal,
          });

          document.querySelector(`.message[data-id="${botId}"]`).innerHTML = ``;
        
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
        
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
            lines.forEach(line => {
              const data = line.trim().slice(5);
              try {
                const parsedData = JSON.parse(data);
                if (parsedData.message && parsedData.message.content !== undefined) {
                  botMessage += parsedData.message.content;
                  addMessage(botMessage, 'assistant', botId);
                }
              } catch (parseError) {
                powAlert({ 
                  color: 'error', 
                  title: 'Error!', 
                  text: data, 
                  position: 'topRight' 
                });
                throw new Error("Failed to parse JSON: " + parseError.message + " Response: " + data);
              }
            });
          }
        
          if (botMessage) {
            saveMessage(botMessage, 'assistant', botId);
          }
        } catch (error) {
          document.querySelector(`.message[data-id="${botId}"]`).innerHTML = `<span class="text-red-500">Fail to get answer, clear the history and try again!</span>`;
          if (error.name !== 'AbortError') {
            console.error('Fetch error:', error);
          }
        } finally {
          generateBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
          generateBtn.classList.remove('bg-red-500');
          generateBtn.classList.add('bg-blue-500');
          promptInput.removeAttribute('disabled');
          abortController = null;
        }
      });
      
      // Handle stop button click
      generateBtn.addEventListener('click', () => {
        if (abortController) {
          abortController.abort();
          generateBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
          generateBtn.classList.remove('bg-red-500');
          generateBtn.classList.add('bg-blue-500');
          abortController = null;
        }
      });
      
      // Handle reset button click
      resetBtn.addEventListener('click', () => {
        localStorage.removeItem('chatMessages');
        responseDiv.innerHTML = '';
        [{ role: 'assistant', content: 'How can I help you today? 🤖', id: 'init0000' }].forEach(msg => addMessage(msg.content, msg.role, msg.id));
        resetBtn.classList.add('hidden');
        document.querySelector('#scrollDown').classList.add('hidden');
        powAlert({ color: 'warn', title: 'Swish!', text: 'Your story was clean!', position: 'topRight' });
      });
    
  })
  .catch((error) => {
    console.error(`An error occurred while retrieving the models:`,error)
    window.errorChatAI = true;
    powAlert({ 
      color: 'error', 
      title: 'Error!', 
      text: 'Ops! See if the Ollama server is running!', 
      position: 'topRight' 
    });
    generateBtn.setAttribute('disabled', true);
    promptInput.setAttribute('disabled', true);
  })

configBtn.addEventListener('click', () => {
  configModal.classList.remove('hidden');
});

cancelConfigBtn.addEventListener('click', () => {
  configModal.classList.add('hidden');
});