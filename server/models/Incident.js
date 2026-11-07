import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  rawErrorLog: {
    type: String,
    required: true,
  },

  generatedResolution: {
    type: String,
  },

  rootCause: {
    type: String,
    default: '',
  },

  engineerFeedback: {
    type: String,
    default: '',
  },

  useMemory: {
    type: Boolean,
    default: true,
  },

  memoriesRecalledCount: {
    type: Number,
    default: 0,
  },

  memoriesRecalled: [
    {
      id: String,
      title: String,
      date: Date,
      service: String,
      relevanceScore: Number,
      rootCause: String,
      resolutionSteps: String,
      learned: {
        type: Boolean,
        default: false,
      },
    },
  ],

  memoryRetained: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ['Open', 'Investigating', 'Resolved'],
    default: 'Investigating',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Incident', incidentSchema);