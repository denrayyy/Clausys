const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

/**
 * @route   PUT /api/users/:id/archive
 * @desc    Archive a user by setting isActive to false
 * @access  Admin only
 */
router.put('/:id/archive', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User archived successfully',
      data: {
        id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error archiving user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving user',
      error: error.message
    });
  }
});

module.exports = router;
