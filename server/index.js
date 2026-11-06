import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { analyze, resolve } from './controllers/incidentController.js';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas (or local fallback)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/opsrecall';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Register API Routes
app.post('/api/incident/analyze', analyze);
app.post('/api/incident/resolve', resolve);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 OpsRecall backend running on http://localhost:${PORT}`);
});