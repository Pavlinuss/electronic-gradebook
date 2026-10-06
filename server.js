const express = require('express');
require('dotenv').config();
const gradeRoutes = require('./routes/grades');
const authRoutes = require('./routes/auth');
const { authenticate } = require('./middleware/auth');
const { profile } = require('./controllers/auth');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.get('/', (req, res) => {
  res.json({ name: 'Electronic gradebook API', resource: '/grades' });
});
app.use('/grades', gradeRoutes);
app.use('/auth', authRoutes);
app.get('/profile', authenticate, profile);

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
  require('./config/auth')();
  const port = process.env.PORT || 3000;
  const { sequelize } = require('./models');
  sequelize.authenticate()
    .then(() => app.listen(port, () => console.log(`Server running at http://localhost:${port}`)))
    .catch((error) => {
      console.error(`Database connection failed: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = app;
