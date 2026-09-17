const express = require('express');
const gradeRoutes = require('./routes/grades');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.get('/', (req, res) => {
  res.json({ name: 'Electronic gradebook API', resource: '/grades' });
});
app.use('/grades', gradeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: 'Invalid request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

module.exports = app;
