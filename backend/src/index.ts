import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { analyzeRouter } from './routes/analyze';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve screenshots as static files
const screenshotsDir = path.join(__dirname, '..', 'screenshots');
app.use('/screenshots', express.static(screenshotsDir));

// Routes
app.use('/api/analyze', analyzeRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 UX Tester Platform Backend running on http://localhost:${PORT}`);
  console.log(`📸 Screenshots served at http://localhost:${PORT}/screenshots`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing!'}\n`);
});

export default app;
