const MaintenanceRequest = require('../models/MaintenanceRequest');
const User = require('../models/User');
const socketIO = require('../utils/socket');

// @route   GET /api/maintenance
// @desc    Get maintenance requests based on role
exports.getRequests = async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'MaintenanceStaff') {
      query.assignedStaff = req.user.id;
    } else if (req.user.role === 'Resident') {
      const user = await User.findById(req.user.id);
      if (user && user.assignedRooms && user.assignedRooms.length > 0) {
        query.roomId = { $in: user.assignedRooms };
      } else {
        // Return only their created requests if no room assigned
        query.createdBy = req.user.id;
      }
    }

    const requests = await MaintenanceRequest.find(query)
      .populate({
        path: 'roomId',
        select: 'roomNumber buildingId',
        populate: {
          path: 'buildingId',
          select: 'name'
        }
      })
      .populate('assignedStaff', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ message: 'Error loading maintenance data. Please ensure database is active.' });
  }
};

// @route   POST /api/maintenance
// @desc    Create a new maintenance request
exports.createRequest = async (req, res) => {
  try {
    const { roomId, description, image } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const targetRoomId = roomId || (req.user.assignedRooms && req.user.assignedRooms[0]);
    if (!targetRoomId) {
      return res.status(400).json({ message: 'Valid room designation required' });
    }

    const newRequest = new MaintenanceRequest({
      roomId: targetRoomId,
      description,
      image,
      status: 'Pending',
      createdBy: req.user.id
    });

    const request = await newRequest.save();
    await request.populate({
      path: 'roomId',
      select: 'roomNumber buildingId',
      populate: { path: 'buildingId', select: 'name' }
    });

    // Notify Admins about new request
    try {
      socketIO.getIO().to('Admin').emit('notification', {
        type: 'NewMaintenance',
        message: `New maintenance for room ${request.roomId.roomNumber}: ${description.slice(0, 25)}...`,
        data: request
      });
    } catch (sErr) {
      console.warn('Socket notification failed, but request saved.');
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ message: error.message || 'Server error creating request' });
  }
};

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance request status/assignment/notes
exports.updateRequest = async (req, res) => {
  try {
    const { status, assignedStaff, notes } = req.body;
    let request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Role-based update permission
    if (req.user.role === 'Admin') {
      if (status) request.status = status;
      if (assignedStaff !== undefined) request.assignedStaff = assignedStaff || null;
      if (notes) request.notes = notes;
    } else if (req.user.role === 'MaintenanceStaff') {
      // Staff can ONLY update if explicitly assigned to them
      if (!request.assignedStaff || request.assignedStaff.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this task. It is not currently assigned to you.' });
      }
      if (status) request.status = status;
      if (notes) request.notes = notes;
    } else {
      return res.status(403).json({ message: 'Residents cannot update maintenance requests' });
    }

    await request.save();
    await request.populate({
      path: 'roomId',
      select: 'roomNumber buildingId',
      populate: { path: 'buildingId', select: 'name' }
    });
    await request.populate('assignedStaff', 'name');

    // Notify User room or staff
    try {
      const io = socketIO.getIO();
      if (assignedStaff && status !== 'Completed') {
        io.to(assignedStaff.toString()).emit('notification', {
          type: 'NewAssignment',
          message: `You were assigned a task for Room ${request.roomId.roomNumber}`,
          data: request
        });
      }

      if (status === 'Completed') {
        io.to(request.roomId._id.toString()).emit('notification', {
          type: 'TaskCompleted',
          message: `Maintenance for Room ${request.roomId.roomNumber} is now Completed!`,
          data: request
        });
      }

      // General refresh for lists
      io.emit('MaintenanceUpdate', request);
    } catch (sErr) {
      console.warn('Socket update failed, but data saved.');
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ message: 'Server error updating request' });
  }
};
