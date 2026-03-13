const Building = require('../models/Building');

// @route   GET /api/buildings
// @desc    Get all buildings
exports.getBuildings = async (req, res) => {
  try {
    const buildings = await Building.find().sort({ createdAt: -1 });
    res.json(buildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/buildings
// @desc    Add a building
exports.createBuilding = async (req, res) => {
  try {
    const { buildingName, location } = req.body;
    
    // Only Admin could ideally add this, but keeping it open per requirements
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can add buildings' });
    }

    const newBuilding = new Building({
      name: buildingName,
      location
    });

    const building = await newBuilding.save();
    res.status(201).json(building);
  } catch (error) {
    console.error('Error creating building:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   DELETE /api/buildings/:id
// @desc    Delete a building
exports.deleteBuilding = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can delete buildings' });
    }
    
    const building = await Building.findById(req.params.id);

    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    await building.deleteOne();
    res.json({ message: 'Building removed' });
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
