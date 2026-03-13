const mongoose = require('mongoose');

const energyUsageLogSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  energyUsed: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('EnergyUsageLog', energyUsageLogSchema);
