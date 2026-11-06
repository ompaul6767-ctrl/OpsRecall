import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  rawErrorLog: { type: String, required: true },
  generatedResolution: { type: String },
  engineerFeedback: { type: String },
  status: { type: String, enum: ['Open', 'Investigating', 'Resolved'], default: 'Investigating' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Incident', incidentSchema);