const express = require('express');
const router = express.Router();
const energyLogController = require('../controllers/energyLogController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, energyLogController.getEnergyLogs);
router.post('/', auth, energyLogController.createEnergyLog);

module.exports = router;
