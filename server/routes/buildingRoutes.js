const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, buildingController.getBuildings);
router.post('/', auth, buildingController.createBuilding);
router.delete('/:id', auth, buildingController.deleteBuilding);

module.exports = router;
