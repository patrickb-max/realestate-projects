import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { V2HtlThresholdModel, V2DemandModel } from '@reprojects/database';

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: '@reprojects/admin-services', version: '2.0.0', status: 'running' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// Update City HTL Thresholds
app.put('/admin-api/htl-thresholds/:city', async (req, res) => {
  const doc = await V2HtlThresholdModel.findOneAndUpdate(
    { city: req.params.city },
    { minCarpetAreaSqFt: req.body.minCarpetAreaSqFt },
    { upsert: true, new: true }
  );
  res.json(doc);
});

// Manual HTL Unlock Valve (3-4 day SLA)
app.post('/admin-api/demands/:id/unlock-htl', async (req, res) => {
  const doc = await V2DemandModel.findOneAndUpdate(
    { demandId: req.params.id, isHighTicketLead: true },
    { isHtlUnlockedByAdmin: true },
    { new: true }
  );
  res.json(doc);
});

async function startAdminServer() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/realestate_projects_v2';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('[admin-services] Connected to MongoDB:', mongoUri);
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      console.error("[db] MongoDB connection failed:", err.message);
      process.exit(1);
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memServer = await MongoMemoryServer.create();
    await mongoose.connect(memServer.getUri());
    console.log('[admin-services] Running on in-memory MongoDB');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[admin-services] Control Panel API listening on http://localhost:${PORT}`);
  });
}

startAdminServer();
