require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Fail fast if critical secrets are missing rather than limping along with insecure defaults.
if (!process.env.JWT_SECRET) {
  console.error('[server] FATAL: JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('[server] FATAL: MONGO_URI is not set. Refusing to start.');
  process.exit(1);
}

const app = express();

// When deployed behind Render/Vercel/etc. the rate-limiter needs the real IP.
app.set('trust proxy', 1);

// Security headers.
// crossOriginResourcePolicy is loosened to 'cross-origin' because this is a REST
// API intentionally consumed from a different origin (Vercel frontend → Render backend).
// The same-origin default would block every cross-origin API response.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS: explicit allow-list driven by CLIENT_ORIGIN env var (comma-separated).
// Origins are read on every request so a Render env-var change takes effect after
// the next redeploy without needing to change code.
// We use cb(null, false) — not cb(new Error()) — for rejections so the browser
// receives a proper CORS denial (no Access-Control-Allow-Origin header) instead of
// a 500 Internal Server Error.
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server calls and same-origin requests (no Origin header).
      if (!origin) return cb(null, true);

      const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (allowedOrigins.length === 0) {
        // CLIENT_ORIGIN not configured — warn once per unique origin but don't 500.
        console.warn(`[cors] CLIENT_ORIGIN not set; blocking origin: ${origin}`);
        return cb(null, false);
      }

      if (allowedOrigins.includes(origin)) return cb(null, true);

      console.warn(`[cors] Blocked unlisted origin: ${origin}`);
      return cb(null, false);
    },
    credentials: true,
  })
);

// JSON routes don't need multi-megabyte bodies; file uploads go through multer/multipart.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Strip any keys starting with '$' or containing '.' from req.body/query/params to block
// NoSQL operator injection (e.g. { "$ne": "" } smuggled into a findOne filter).
app.use(mongoSanitize());

// Static uploads (when using local storage strategy).
// Force download instead of inline render so a crafted HTML/SVG can't execute on our origin.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mockups', require('./routes/mockups'));
app.use('/api/orders', require('./routes/orders'));

// Landing route
app.get('/', (req, res) => {
  res.json({
    name: 'Product Ordering Dashboard API',
    docs: '/api/health',
    endpoints: ['/api/auth', '/api/mockups', '/api/orders'],
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
});

module.exports = app;
