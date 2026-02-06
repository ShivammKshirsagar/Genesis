// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { generateStory } = require('./src/controllers/storyController'); // Import the controller

const app = express();
app.use(cors());
app.use(express.json());

// THE ENDPOINT
app.post('/api/generate-story', generateStory);

function startServer(port) {
  const server = app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    console.error('❌ Server failed to start:', err);
    process.exitCode = 1;
  });
}

const PORT = Number(process.env.PORT) || 5000;
startServer(PORT);