// =============================================================================
// FloreceS — Express application (app.js)
// =============================================================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const skincareLogs = require('./data/logs');
const skinAdvisorRouter = require('./routes/skin-advisor');

// =============================================================================
// App setup
// =============================================================================

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =============================================================================
// Feature: Image uploads (product & result photos on add/edit)
// =============================================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// =============================================================================
// Middleware & view configuration
// =============================================================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// Feature: AI Skin Advisor (bonus — routes/skin-advisor.js)
// =============================================================================

app.use('/api/skin-advisor', skinAdvisorRouter);

// =============================================================================
// Helpers — stats, formatting, in-memory log access
// =============================================================================

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatDate(dateString) {
  if (!dateString) {
    return 'Unknown date';
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function getCurrentStreak() {
  const uniqueDates = Array.from(new Set(skincareLogs.map(log => log.date).filter(Boolean)));
  const sortedDates = uniqueDates
    .map(dateStr => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      return date;
    })
    .filter(date => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a);

  if (!sortedDates.length) {
    return 0;
  }

  let streak = 1;
  let previousDate = sortedDates[0];

  for (let index = 1; index < sortedDates.length; index += 1) {
    const currentDate = sortedDates[index];
    const diffDays = Math.round((previousDate - currentDate) / MS_PER_DAY);

    if (diffDays === 1) {
      streak += 1;
      previousDate = currentDate;
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
}

function getTotals() {
  const totalLogs = skincareLogs.length;
  const morningCount = skincareLogs.filter(log => log.routineType === 'Morning').length;
  const nightCount = skincareLogs.filter(log => log.routineType === 'Night').length;
  const averageRating = totalLogs
    ? (skincareLogs.reduce((sum, log) => sum + Number(log.rating), 0) / totalLogs).toFixed(1)
    : 'N/A';

  return {
    totalLogs,
    morningCount,
    nightCount,
    averageRating,
    streak: getCurrentStreak()
  };
}

app.locals.formatDate = formatDate;
app.locals.routineBadgeClass = routineType => (routineType === 'Night' ? 'badge-night' : 'badge-morning');
app.locals.starsFor = rating => {
  const value = Number(rating) || 0;
  return Array.from({ length: 5 }, (_, index) => (index < value ? '★' : '☆')).join('');
};

function getNextId() {
  return skincareLogs.reduce((max, log) => Math.max(max, log.id), 0) + 1;
}

function findLog(id) {
  return skincareLogs.find(log => log.id === Number(id));
}

function sortLogsByDateNewest(logs) {
  return logs.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
}

// =============================================================================
// Helpers — success messages after add / edit / delete
// =============================================================================

function getFlashMessage(query) {
  if (query.saved === '1') {
    return { type: 'success', text: 'Log saved successfully.' };
  }
  if (query.updated === '1') {
    return { type: 'success', text: 'Log updated successfully.' };
  }
  if (query.deleted === '1') {
    return { type: 'success', text: 'Log deleted successfully.' };
  }
  return null;
}

// =============================================================================
// Helpers — search & filter (CA1 additional feature)
// =============================================================================

function filterLogs({ product, condition, routineType }) {
  return skincareLogs.filter(log => {
    const matchesProduct = product
      ? log.productsUsed.toLowerCase().includes(product.toLowerCase())
      : true;
    const matchesCondition = condition
      ? log.skinCondition.toLowerCase().includes(condition.toLowerCase())
      : true;
    const matchesRoutineType = routineType && routineType !== 'All'
      ? log.routineType === routineType
      : true;

    return matchesProduct && matchesCondition && matchesRoutineType;
  });
}

// =============================================================================
// Feature: Dashboard (home) — stats & recent routines
// =============================================================================

app.get('/', (req, res) => {
  const totals = getTotals();
  const recentLogs = skincareLogs
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  res.render('home', {
    ...totals,
    recentLogs
  });
});

// =============================================================================
// Feature: View all logs (newest first)
// =============================================================================

app.get('/logs', (req, res) => {
  const totals = getTotals();
  const flash = getFlashMessage(req.query);
  res.render('logs', {
    logs: sortLogsByDateNewest(skincareLogs),
    filters: {},
    flash,
    ...totals
  });
});

// =============================================================================
// Feature: Search & filter logs (CA1 additional feature)
// =============================================================================

app.get('/logs/search', (req, res) => {
  const filters = {
    product: req.query.product || '',
    condition: req.query.condition || '',
    routineType: req.query.routineType || 'All'
  };
  const results = sortLogsByDateNewest(filterLogs(filters));
  const totals = getTotals();
  const flash = getFlashMessage(req.query);

  res.render('logs', { logs: results, filters, flash, ...totals });
});

// =============================================================================
// Feature: Add log
// =============================================================================

app.get('/logs/add', (req, res) => {
  res.render('add');
});

app.post('/logs/add', upload.fields([
  { name: 'productsPhoto', maxCount: 1 },
  { name: 'resultPhoto', maxCount: 1 }
]), (req, res) => {
  const files = req.files || {};

  const newLog = {
    id: getNextId(),
    date: req.body.date || '',
    routineType: req.body.routineType || 'Morning',
    skinCondition: req.body.skinCondition || '',
    productsUsed: req.body.productsUsed || '',
    result: req.body.result || '',
    rating: Number(req.body.rating) || 0,
    productsPhoto: files.productsPhoto?.[0]?.filename || '',
    resultPhoto: files.resultPhoto?.[0]?.filename || ''
  };

  skincareLogs.push(newLog);
  res.redirect('/logs?saved=1');
});

// =============================================================================
// Feature: View log detail
// =============================================================================

app.get('/logs/:id', (req, res) => {
  const log = findLog(req.params.id);
  if (!log) {
    return res.status(404).send('Log not found');
  }
  res.render('detail', { log });
});

// =============================================================================
// Feature: Edit log
// =============================================================================

app.get('/logs/edit/:id', (req, res) => {
  const log = findLog(req.params.id);
  if (!log) {
    return res.status(404).send('Log not found');
  }
  res.render('edit', { log });
});

app.post('/logs/edit/:id', upload.fields([
  { name: 'productsPhoto', maxCount: 1 },
  { name: 'resultPhoto', maxCount: 1 }
]), (req, res) => {
  const log = findLog(req.params.id);
  if (!log) {
    return res.status(404).send('Log not found');
  }

  const files = req.files || {};

  log.date = req.body.date || log.date;
  log.routineType = req.body.routineType || log.routineType;
  log.skinCondition = req.body.skinCondition || log.skinCondition;
  log.productsUsed = req.body.productsUsed || log.productsUsed;
  log.result = req.body.result || log.result;
  log.rating = Number(req.body.rating) || log.rating;

  if (files.productsPhoto?.[0]) {
    log.productsPhoto = files.productsPhoto[0].filename;
  }
  if (files.resultPhoto?.[0]) {
    log.resultPhoto = files.resultPhoto[0].filename;
  }

  res.redirect('/logs?updated=1');
});

// =============================================================================
// Feature: Delete log
// =============================================================================

app.post('/logs/delete/:id', (req, res) => {
  const index = skincareLogs.findIndex(log => log.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).send('Log not found');
  }
  skincareLogs.splice(index, 1);
  res.redirect('/logs?deleted=1');
});

// =============================================================================
// Feature: 404 page
// =============================================================================

app.use((req, res) => {
  res.status(404).render('404');
});

// =============================================================================
// Start server
// =============================================================================

app.listen(PORT, () => {
  console.log(`FloreceS is running on http://localhost:${PORT}`);
});
