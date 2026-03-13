const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, maintenanceController.getRequests);
router.post('/', auth, maintenanceController.createRequest);
router.put('/:id', auth, maintenanceController.updateRequest);

module.exports = router;
