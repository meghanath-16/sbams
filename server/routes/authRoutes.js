const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', authController.registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.loginUser);

// @route   GET /api/auth/role/:role
// @desc    Get users by role
// @access  Private (Admin only)
router.get('/role/:role', auth, authController.getUsersByRole);

// @route   POST /api/auth/logout
// @desc    Logout user (Session cleanup)
// @access  Public
router.post('/logout', (req, res) => {
  console.log('User logout requested');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
