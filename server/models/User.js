const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'MaintenanceStaff', 'Resident'],
    required: true,
  },
  assignedRooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false,
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
