const EnergyUsageLog = require('../models/EnergyUsageLog');
const User = require('../models/User');
const socketIO = require('../utils/socket');

// @route   GET /api/energylogs
// @desc    Get energy logs based on role
exports.getEnergyLogs = async (req, res) => {
  try {
    let query = {};

    // Residents can only see logs for their assigned room
    if (req.user.role === 'Resident') {
      const user = await User.findById(req.user.id);
      if (user && user.assignedRooms && user.assignedRooms.length > 0) {
        query.roomId = { $in: user.assignedRooms };
      } else {
        // Return empty if no room assigned
        return res.json([]);
      }
    }

    const logs = await EnergyUsageLog.find(query)
      .populate({
        path: 'roomId',
        select: 'roomNumber buildingId',
        populate: {
          path: 'buildingId',
          select: 'name'
        }
      })
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching energy logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/energylogs
// @desc    Add an energy log
exports.createEnergyLog = async (req, res) => {
  try {
    const { roomId, energyUsed, timestamp } = req.body;
    
    // Only Admin or MaintenanceStaff can add energy logs
    if (req.user.role !== 'Admin' && req.user.role !== 'MaintenanceStaff') {
      return res.status(403).json({ message: 'Only Admins or Maintenance Staff can add energy logs' });
    }

    const newLog = new EnergyUsageLog({
      roomId,
      energyUsed,
      timestamp: timestamp || Date.now()
    });

    const log = await newLog.save();
    await log.populate('roomId', 'roomNumber');

    // Real-time notification for high consumption
    if (Number(energyUsed) > 100) {
      socketIO.getIO().to('Admin').emit('notification', {
        type: 'HighUsage',
        message: `High usage detected: room ${log.roomId.roomNumber} - ${energyUsed}kWh!`,
        data: log
      });
    }

    // Notify of new log for real-time chart updates
    socketIO.getIO().emit('NewEnergyLog', log);

    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating energy log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
