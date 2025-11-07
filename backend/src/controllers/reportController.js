// backend/src/controllers/reportController.js
const Report = require('../models/Report');
const Project = require('../models/Project');
const AdminLog = require('../models/AdminLog');
const { AppError } = require('../middleware/errorHandler');

// @desc    Generate contribution report
// @route   POST /api/reports/contribution
// @access  Private (Project members)
exports.generateContributionReport = async (req, res, next) => {
  try {
    const { projectId, startDate, endDate } = req.body;

    if (!projectId || !startDate || !endDate) {
      return next(new AppError('Project ID, start date, and end date are required', 400));
    }

    // Check if user is project member
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isMember && !isAdmin) {
      return next(new AppError('Not authorized to generate report for this project', 403));
    }

    // Generate report data
    const reportData = await Report.generateContributionReport(
      projectId,
      new Date(startDate),
      new Date(endDate)
    );

    // Save report
    const report = await Report.create({
      project: projectId,
      reportType: 'contribution',
      title: `Contribution Report - ${reportData.projectTitle}`,
      description: `Member contributions from ${startDate} to ${endDate}`,
      generatedBy: req.user.id,
      dateRange: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      data: reportData,
      format: 'json',
      status: 'completed',
    });

    // Log action if admin
    if (isAdmin) {
      await AdminLog.logAction({
        user: req.user.id,
        action: 'report_generated',
        targetType: 'Project',
        targetId: projectId,
        details: { reportType: 'contribution', reportId: report._id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Contribution report generated successfully',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate milestone completion report
// @route   POST /api/reports/milestone
// @access  Private (Project members)
exports.generateMilestoneReport = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return next(new AppError('Project ID is required', 400));
    }

    // Check authorization
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isMember && !isAdmin) {
      return next(new AppError('Not authorized', 403));
    }

    // Generate report data
    const reportData = await Report.generateMilestoneReport(projectId);

    // Save report
    const report = await Report.create({
      project: projectId,
      reportType: 'milestone',
      title: `Milestone Report - ${reportData.projectTitle}`,
      description: 'Comprehensive milestone completion status',
      generatedBy: req.user.id,
      dateRange: {
        startDate: project.createdAt,
        endDate: new Date(),
      },
      data: reportData,
      format: 'json',
      status: 'completed',
    });

    res.status(201).json({
      success: true,
      message: 'Milestone report generated successfully',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate project summary report
// @route   POST /api/reports/summary
// @access  Private (Project members)
exports.generateProjectSummary = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return next(new AppError('Project ID is required', 400));
    }

    const project = await Project.findById(projectId)
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check authorization
    const isMember = project.members.some(m => m.user._id.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isMember && !isAdmin) {
      return next(new AppError('Not authorized', 403));
    }

    // Get related data
    const Task = require('../models/Task');
    const File = require('../models/File');
    const Milestone = require('../models/Milestone');

    const [tasks, files, milestones] = await Promise.all([
      Task.find({ project: projectId }),
      File.find({ project: projectId, isActive: true }),
      Milestone.find({ project: projectId, isActive: true }),
    ]);

    const summaryData = {
      project: {
        title: project.title,
        description: project.description,
        status: project.status,
        category: project.category,
        owner: project.owner,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      team: {
        size: project.members.length,
        members: project.members.map(m => ({
          name: `${m.user.firstName} ${m.user.lastName}`,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
      tasks: {
        total: tasks.length,
        byStatus: {
          todo: tasks.filter(t => t.status === 'todo').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          review: tasks.filter(t => t.status === 'review').length,
          done: tasks.filter(t => t.status === 'done').length,
        },
        completionRate: tasks.length > 0 
          ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
          : 0,
      },
      milestones: {
        total: milestones.length,
        completed: milestones.filter(m => m.status === 'completed').length,
        overdue: milestones.filter(m => m.isOverdue && m.status !== 'completed').length,
      },
      files: {
        total: files.length,
        deliverables: files.filter(f => f.isDeliverable).length,
        totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
      },
    };

    // Save report
    const report = await Report.create({
      project: projectId,
      reportType: 'project_summary',
      title: `Project Summary - ${project.title}`,
      description: 'Complete project overview and statistics',
      generatedBy: req.user.id,
      dateRange: {
        startDate: project.createdAt,
        endDate: new Date(),
      },
      data: summaryData,
      format: 'json',
      status: 'completed',
    });

    res.status(201).json({
      success: true,
      message: 'Project summary generated successfully',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project reports
// @route   GET /api/reports/project/:projectId
// @access  Private (Project members)
exports.getProjectReports = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { type, page = 1, limit = 10 } = req.query;

    // Check authorization
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isMember && !isAdmin) {
      return next(new AppError('Not authorized', 403));
    }

    const query = { project: projectId };
    if (type) query.reportType = type;

    const reports = await Report.find(query)
      .populate('generatedBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reports,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalReports: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private (Project members)
exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'firstName lastName email')
      .populate('project', 'title');

    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    // Check authorization
    const project = await Project.findById(report.project._id);
    const isMember = project.members.some(m => m.user.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isMember && !isAdmin) {
      return next(new AppError('Not authorized', 403));
    }

    res.status(200).json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Report creator or admin)
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    const isCreator = report.generatedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return next(new AppError('Not authorized to delete this report', 403));
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};