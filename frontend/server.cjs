const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5173;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  index: 'index.html',
  extensions: ['html']
}));

// Handle SPA routing - serve index.html for any non-static file
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend running at http://0.0.0.0:${PORT}`);
});
