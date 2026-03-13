const Room = require('../models/Room');

// @route   GET /api/rooms
// @desc    Get all rooms (populated with building data)
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('buildingId', 'name location').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error loading room directory.' });
  }
};

// @route   POST /api/rooms
// @desc    Add a room
exports.createRoom = async (req, res) => {
  try {
    const { buildingId, roomNumber, capacity, status } = req.body;
    
    // Auth check moved here since we removed it from the route middleware to allow registration access
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Administrative privileges required.' });
    }

    const newRoom = new Room({
      buildingId,
      roomNumber,
      capacity,
      status: status || 'Available'
    });

    const room = await newRoom.save();
    // Populate the building info before returning
    await room.populate('buildingId', 'name');
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can delete rooms' });
    }
    
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.deleteOne();
    res.json({ message: 'Room removed' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/rooms/:id
// @desc    Get room by ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('buildingId', 'name location');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

