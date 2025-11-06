const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      skills,
      portfolio,
      availability,
      hourlyRate,
      location,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (portfolio) user.portfolio = portfolio;
    if (availability) user.availability = availability;
    if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    if (location) user.location = location;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return next(new AppError('Please provide an avatar URL', 400));
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.avatar = avatar;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new AppError('Please provide current and new password', 400)
      );
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (for browsing freelancers)
// @route   GET /api/users
// @access  Public
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, skills, availability, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by availability
    if (availability) {
      query.availability = availability;
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',');
      query.skills = { $in: skillsArray };
    }

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalUsers: count,
      },
    });
  } catch (error) {
    next(error);
  }
};