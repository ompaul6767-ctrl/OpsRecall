
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import {
  analyze,
  resolve
} from './controllers/incidentController.js';

import Incident from './models/Incident.js';
import { BANK } from './services/memory.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OpsRecall Backend is running!'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'OpsRecall API is healthy',
    database:
      mongoose.connection.readyState === 1
        ? 'Connected'
        : 'Disconnected'
  });
});

// Analyze and resolve
app.post('/api/incident/analyze', analyze);
app.post('/api/incident/resolve', resolve);

// Get all incidents
app.get('/api/incident', async (req, res) => {
  try {
    const incidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch incidents.'
    });
  }
});

// Get single incident
app.get('/api/incident/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid incident ID.'
      });
    }

    const incident = await Incident.findById(id).lean();

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found.'
      });
    }

    return res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch incident.'
    });
  }
});

// Get Hindsight Memory Bank
app.get('/api/memory', async (req, res) => {
  try {
    const apiKey = process.env.HINDSIGHT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'HINDSIGHT_API_KEY is missing.'
      });
    }

    const baseUrl = (
      process.env.HINDSIGHT_BASE_URL ||
      'https://api.hindsight.vectorize.io'
    ).replace(/\/+$/, '');

    const url =
      `${baseUrl}/v1/default/banks/` +
      `${encodeURIComponent(BANK)}/memories/list?limit=100&offset=0`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        'Hindsight list memories failed:',
        response.status,
        errorText
      );

      return res.status(502).json({
        error: 'Unable to fetch memories from Hindsight.'
      });
    }

    const data = await response.json();

    const memories = (data.items || []).map((item) => {
      const memoryText = item.text || '';
      const lines = memoryText.split('\n');

      const rootCauseLine = lines.find((line) =>
        line.toLowerCase().startsWith('root cause:')
      );

      const metadata = item.metadata || {};

      return {
        id: item.id,
        title:
          lines[0]?.slice(0, 100) || 'Operational Memory',
        date:
          item.date ||
          item.mentioned_at ||
          item.updated_at ||
          null,
        service: item.entities || '',
        relevanceScore: null,
        rootCause: rootCauseLine
          ? rootCauseLine.slice('root cause:'.length).trim()
          : '',
        resolutionSteps: memoryText,
        learned:
          metadata.type === 'resolved_incident' ||
          (item.context || '')
            .toLowerCase()
            .includes('resolved incident')
      };
    });

    return res.json(memories);
  } catch (error) {
    console.error('Memory API error:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch Hindsight memories.'
    });
  }
});

// Dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalIncidents,
      resolvedIncidents,
      memoriesStored,
      memoryEnabledCount,
      recalledIncidents
    ] = await Promise.all([
      Incident.countDocuments(),

      Incident.countDocuments({
        status: 'Resolved'
      }),

      Incident.countDocuments({
        memoryRetained: true
      }),

      Incident.countDocuments({
        useMemory: true
      }),

      Incident.countDocuments({
        useMemory: true,
        memoriesRecalledCount: { $gt: 0 }
      })
    ]);

    const avgResolutionImprovement =
      memoryEnabledCount > 0
        ? Math.round(
            (recalledIncidents / memoryEnabledCount) * 100
          )
        : 0;

    return res.json({
      totalIncidents,
      resolvedIncidents,
      memoriesStored,
      avgResolutionImprovement
    });
  } catch (error) {
    console.error('Stats API error:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch dashboard statistics.'
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start server after MongoDB connection
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/opsrecall';

    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(
        `🚀 OpsRecall backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      '❌ Backend startup failed:',
      error.message
    );

    process.exit(1);
  }
}

startServer();
