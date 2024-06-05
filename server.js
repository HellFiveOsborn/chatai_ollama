const express = require('express');
const path = require('path');
const axios = require('axios');
const openaiTokenCounter = require('openai-gpt-token-counter');

const app = express();
const port = 3000;

// This line will parse JSON bodies and populate `req.body`
app.use(express.json());

// This line will parse URL-encoded bodies and populate `req.body`
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(filePath);
});

// Endpoint to transmit response data using eventstream
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemPrompt = req.body.system;
  if (systemPrompt) {
    req.body.messages.unshift({ role: 'system', content: systemPrompt });
  }

  delete req.body.system;

  req.body.messages.forEach((message) => {
    delete message.id;
  });

  const tokenCount = openaiTokenCounter.chat(req.body.messages, 'gpt-3.5-turbo');
  if (tokenCount >= 4096) {
    res.status(400).write('data: The request exceeds the maximum token limit of 4096. Please, clear the chat and start another conversation.\n\n');
    res.end();
    return;
  }

  try {
    const response = await axios.post('http://localhost:11434/api/chat', JSON.stringify(req.body), {
      responseType: 'stream',
    });

    response.data.on('data', (chunk) => {
      const lines = chunk.toString('utf8').split('\n');
      lines.forEach((line) => {
        if (line.trim()!== '') {
          res.write(`data: ${line}\n\n`);
        }
      });
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (error) => {
      console.error(error);
      res.status(500).write('data: An error occurred while processing the request.\n\n');
      res.end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).write('data: An error occurred while processing the request.\n\n');
    res.end();
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:11434/api/tags');
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
})

app.listen(port, () => {
  console.log('\x1b[32m%s\x1b[0m', `Server running on http://localhost:${port}`);
});