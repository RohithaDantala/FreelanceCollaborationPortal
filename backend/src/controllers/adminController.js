// backend/src/controllers/adminController.js
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const AdminLog = require('../models/AdminLog');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
    ]);

    // User growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Project trends
    const projectTrends = await Project.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          growth: userGrowth,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          trends: projectTrends,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalUsers: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend/Activate user
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'admin') {
      return next(new AppError('Cannot modify admin user status', 403));
    }

    user.isActive = !user.isActive;
    await user.save();

    // Log admin action
    await AdminLog.logAction({
      user: req.user.id,
      action: user.isActive ? 'user_activated' : 'user_suspended',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'admin') {
      return next(new AppError('Cannot delete admin user', 403));
    }

    // Log before deletion
    await AdminLog.logAction({
      user: req.user.id,
      action: 'user_deleted',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['freelancer', 'project_owner', 'admin'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log admin action
    await AdminLog.logAction({
      user: req.user.id,
      action: 'user_role_changed',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email, oldRole, newRole: role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (admin view)
// @route   GET /api/admin/projects
// @access  Private (Admin only)
exports.getAllProjects = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        projects,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalProjects: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project (admin)
// @route   DELETE /api/admin/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Log before deletion
    await AdminLog.logAction({
      user: req.user.id,
      action: 'project_deleted',
      targetType: 'Project',
      targetId: project._id,
      details: { title: project.title, owner: project.owner },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
exports.getAdminLogs = async (req, res, next) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;

    const query = {};
    if (action) query.action = action;

    const logs = await AdminLog.find(query)
      .populate('user', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await AdminLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        logs,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalLogs: count,
      },
    });
  } catch (error) {
    next(error);
  }
};