const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/authMiddleware');

router.get('/', roomController.getRooms); // Public for registration
router.get('/:id', auth, roomController.getRoomById);
router.post('/', auth, roomController.createRoom);
router.delete('/:id', auth, roomController.deleteRoom);

module.exports = router;
