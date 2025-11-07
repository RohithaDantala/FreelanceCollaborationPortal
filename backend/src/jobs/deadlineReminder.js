const cron = require('node-cron');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../config/email');

// Helper function to calculate days difference
const getDaysUntil = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Check and send deadline reminders
const checkDeadlines = async () => {
  try {
    console.log('🔔 Running deadline reminder check...');

    // Check tasks with upcoming deadlines (3 days before)
    const upcomingTasks = await Task.find({
      deadline: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      status: { $ne: 'done' },
    })
      .populate('project', 'title owner')
      .populate('assignee', 'firstName lastName email');

    for (const task of upcomingTasks) {
      if (!task.assignee) continue;

      const daysLeft = getDaysUntil(task.deadline);
      
      // Send notification
      await Notification.createNotification({
        recipient: task.assignee._id,
        sender: task.project.owner,
        type: 'task_deadline',
        title: `Task Deadline Approaching`,
        message: `Task "${task.title}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        link: `/projects/${task.project._id}/tasks`,
        project: task.project._id,
        task: task._id,
      });

      // Send email
      try {
        const emailTemplate = emailTemplates.deadlineReminder({
          userName: task.assignee.firstName,
          projectTitle: task.project.title,
          deadline: new Date(task.deadline).toLocaleDateString(),
          daysLeft,
          projectId: task.project._id,
        });
        
        await sendEmail(task.assignee.email, emailTemplate);
      } catch (error) {
        console.error(`Failed to send deadline email to ${task.assignee.email}:`, error);
      }
    }

    // Check milestones with upcoming deadlines (5 days before)
    const upcomingMilestones = await Milestone.find({
      dueDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      status: { $ne: 'completed' },
      isActive: true,
    }).populate('project', 'title owner members');

    for (const milestone of upcomingMilestones) {
      const daysLeft = getDaysUntil(milestone.dueDate);
      
      const Project = require('../models/Project');
      const project = await Project.findById(milestone.project._id)
        .populate('owner', 'firstName lastName email')
        .populate('members.user', 'firstName lastName email');

      // Send to project owner
      await Notification.createNotification({
        recipient: project.owner._id,
        sender: project.owner._id,
        type: 'milestone_deadline',
        title: `