const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  roomNumber: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied'],
    default: 'Available',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
