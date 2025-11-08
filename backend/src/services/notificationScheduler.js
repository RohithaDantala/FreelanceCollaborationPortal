// backend/src/services/notificationScheduler.js
const cron = require('node-cron');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const emailService = require('./emailService');

class NotificationScheduler {
  constructor() {
    this.jobs = [];
  }

  // Initialize all cron jobs
  initializeSchedulers() {
    console.log('Initializing notification schedulers...');

    // Check deadlines every hour
    this.jobs.push(
      cron.schedule('0 * * * *', () => {
        this.checkDeadlines();
      })
    );

    // Check for new project matches every 6 hours
    this.jobs.push(
      cron.schedule('0 */6 * * *', () => {
        this.checkProjectMatches();
      })
    );

    console.log('Notification schedulers initialized');
  }

  // Check for upcoming deadlines and send reminders
  async checkDeadlines() {
    try {
      console.log('Checking deadlines...');
      const now = new Date();

      // Check task deadlines
      await this.checkTaskDeadlines(now);
      
      // Check project deadlines
      await this.checkProjectDeadlines(now);

    } catch (error) {
      console.error('Deadline check error:', error);
    }
  }

  async checkTaskDeadlines(now) {
    // Find tasks with deadlines in the next 48 hours
    const fortyEightHours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const twentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHour = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    // Tasks due in 48 hours
    const tasks48h = await Task.find({
      deadline: { 
        $gte: now, 
        $lte: fortyEightHours 
      },
      status: { $ne: 'completed' },
      reminderSent48h: { $ne: true }
    }).populate('assignedTo', 'name email')
      .populate('project', 'title');

    for (const task of tasks48h) {
      if (task.assignedTo) {
        const hoursRemaining = Math.floor((new Date(task.deadline) - now) / (1000 * 60 * 60));
        await emailService.sendDeadlineReminder(
          task.assignedTo.email,
          task.assignedTo.name,
          task,
          hoursRemaining,
          'task'
        );
        
        // Mark as sent
        await Task.findByIdAndUpdate(task._id, { reminderSent48h: true });
      }
    }

    // Tasks due in 24 hours
    const tasks24h = await Task.find({
      deadline: { 
        $gte: now, 
        $lte: twentyFourHours 
      },
      status: { $ne: 'completed' },
      reminderSent24h: { $ne: true }
    }).populate('assignedTo', 'name email')
      .populate('project', 'title');

    for (const task of tasks24h) {
      if (task.assignedTo) {
        const hoursRemaining = Math.floor((new Date(task.deadline) - now) / (1000 * 60 * 60));
        await emailService.sendDeadlineReminder(
          task.assignedTo.email,
          task.assignedTo.name,
          task,
          hoursRemaining,
          'task'
        );
        
        await Task.findByIdAndUpdate(task._id, { reminderSent24h: true });
      }
    }

    // Tasks due today (within 1 hour of start of day)
    const tasksToday = await Task.find({
      deadline: { 
        $gte: now, 
        $lte: oneHour 
      },
      status: { $ne: 'completed' },
      reminderSentToday: { $ne: true }
    }).populate('assignedTo', 'name email')
      .populate('project', 'title');

    for (const task of tasksToday) {
      if (task.assignedTo) {
        const hoursRemaining = Math.floor((new Date(task.deadline) - now) / (1000 * 60 * 60));
        await emailService.sendDeadlineReminder(
          task.assignedTo.email,
          task.assignedTo.name,
          task,
          hoursRemaining,
          'task'
        );
        
        await Task.findByIdAndUpdate(task._id, { reminderSentToday: true });
      }
    }

    console.log(`Sent ${tasks48h.length + tasks24h.length + tasksToday.length} task deadline reminders`);
  }

  async checkProjectDeadlines(now) {
    const fortyEightHours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const twentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Projects due in 48 hours
    const projects48h = await Project.find({
      deadline: { 
        $gte: now, 
        $lte: fortyEightHours 
      },
      status: { $ne: 'completed' },
      reminderSent48h: { $ne: true }
    }).populate('owner', 'name email')
      .populate('team.user', 'name email');

    for (const project of projects48h) {
      const hoursRemaining = Math.floor((new Date(project.deadline) - now) / (1000 * 60 * 60));
      
      // Notify owner
      await emailService.sendDeadlineReminder(
        project.owner.email,
        project.owner.name,
        project,
        hoursRemaining,
        'project'
      );

      // Notify all team members
      for (const member of project.team) {
        if (member.user && member.status === 'approved') {
          await emailService.sendDeadlineReminder(
            member.user.email,
            member.user.name,
            project,
            hoursRemaining,
            'project'
          );
        }
      }

      await Project.findByIdAndUpdate(project._id, { reminderSent48h: true });
    }

    // Projects due in 24 hours
    const projects24h = await Project.find({
      deadline: { 
        $gte: now, 
        $lte: twentyFourHours 
      },
      status: { $ne: 'completed' },
      reminderSent24h: { $ne: true }
    }).populate('owner', 'name email')
      .populate('team.user', 'name email');

    for (const project of projects24h) {
      const hoursRemaining = Math.floor((new Date(project.deadline) - now) / (1000 * 60 * 60));
      
      await emailService.sendDeadlineReminder(
        project.owner.email,
        project.owner.name,
        project,
        hoursRemaining,
        'project'
      );

      for (const member of project.team) {
        if (member.user && member.status === 'approved') {
          await emailService.sendDeadlineReminder(
            member.user.email,
            member.user.name,
            project,
            hoursRemaining,
            'project'
          );
        }
      }

      await Project.findByIdAndUpdate(project._id, { reminderSent24h: true });
    }

    console.log(`Sent ${projects48h.length + projects24h.length} project deadline reminders`);
  }

  // Check for new projects matching freelancer skills
  async checkProjectMatches() {
    try {
      console.log('Checking project matches...');

      // Get recent projects (last 6 hours)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      
      const recentProjects = await Project.find({
        createdAt: { $gte: sixHoursAgo },
        status: 'open',
        matchNotificationsSent: { $ne: true }
      });

      for (const project of recentProjects) {
        // Find freelancers with matching skills
        const matchingFreelancers = await User.find({
          role: 'freelancer',
          skills: { $in: project.tags || [] },
          emailNotifications: { $ne: false }
        });

        if (matchingFreelancers.length > 0) {
          const freelancersWithMatches = matchingFreelancers.map(freelancer => {
            const matchingTags = project.tags.filter(tag => 
              freelancer.skills.includes(tag)
            );
            
            return {
              email: freelancer.email,
              name: freelancer.name,
              matchingTags
            };
          });

          // Send batch emails
          await emailService.sendBatchProjectMatches(project, freelancersWithMatches);
          
          // Mark notifications as sent
          await Project.findByIdAndUpdate(project._id, { 
            matchNotificationsSent: true 
          });

          console.log(`Sent project match notifications for "${project.title}" to ${freelancersWithMatches.length} freelancers`);
        }
      }

    } catch (error) {
      console.error('Project match check error:', error);
    }
  }

  // Stop all cron jobs
  stopAll() {
    this.jobs.forEach(job => job.stop());
    console.log('All schedulers stopped');
  }
}

module.exports = new NotificationScheduler();

