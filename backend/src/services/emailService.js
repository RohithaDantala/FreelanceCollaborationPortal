// backend/src/services/emailService.js - NODEMAILER VERSION
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.EMAIL_USER || 'noreply@freelanceportal.com';
    this.fromName = process.env.FROM_NAME || 'Freelance Portal';
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Gmail configuration
    if (process.env.EMAIL_SERVICE === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD // App password, not regular password
        }
      });
    } 
    // Outlook/Hotmail configuration
    else if (process.env.EMAIL_SERVICE === 'outlook') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
    // Custom SMTP configuration
    else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service error:', error);
      } else {
        console.log('✅ Email service is ready to send messages');
      }
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Application notification to client
  async sendApplicationNotification(clientEmail, freelancerName, projectTitle, projectId) {
    const subject = `New Application for ${projectTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎯 New Project Application</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${freelancerName}</strong> has applied to your project:</p>
            <h2 style="color: #3b82f6; margin: 20px 0;">${projectTitle}</h2>
            <p>Please review their profile, portfolio, and application materials to make a decision.</p>
            <a href="${process.env.FRONTEND_URL}/projects/${projectId}" class="button">
              View Application →
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br/><strong>Freelance Portal Team</strong></p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Freelance Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: clientEmail,
      subject,
      html,
      text: `${freelancerName} has applied to your project: ${projectTitle}. Visit your dashboard to review the application.`
    });
  }

  // Application approved notification to freelancer
  async sendApplicationApproved(freelancerEmail, projectTitle, clientName, projectId) {
    const subject = `🎉 Application Approved: ${projectTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
          .badge { display: inline-block; padding: 8px 16px; background: #d1fae5; color: #065f46; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <div class="badge">✓ Application Approved</div>
            <p>Great news!</p>
            <p>Your application for <strong>${projectTitle}</strong> has been approved by <strong>${clientName}</strong>.</p>
            <p>You can now:</p>
            <ul style="line-height: 1.8;">
              <li>Begin working on the project</li>
              <li>Schedule an interview with the client</li>
              <li>Access project files and requirements</li>
              <li>Start tracking your time</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}/projects/${projectId}" class="button">
              Get Started →
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br/><strong>Freelance Portal Team</strong></p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Freelance Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: freelancerEmail,
      subject,
      html,
      text: `Your application for ${projectTitle} has been approved! Visit the project page to get started.`
    });
  }

  // Application rejected notification to freelancer
  async sendApplicationRejected(freelancerEmail, projectTitle, clientName) {
    const subject = `Application Update: ${projectTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Application Status Update</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for your interest in <strong>${projectTitle}</strong>.</p>
            <p>After careful consideration, ${clientName} has decided to move forward with other candidates for this project.</p>
            <p>We encourage you to:</p>
            <ul style="line-height: 1.8;">
              <li>Continue browsing available projects</li>
              <li>Update your profile and portfolio</li>
              <li>Apply to projects matching your skills</li>
            </ul>
            <p>Don't be discouraged! The right project is out there waiting for you.</p>
            <a href="${process.env.FRONTEND_URL}/browse-projects" class="button">
              Browse Projects →
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br/><strong>Freelance Portal Team</strong></p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Freelance Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: freelancerEmail,
      subject,
      html,
      text: `Your application for ${projectTitle} was not selected. Keep looking for projects that match your skills!`
    });
  }

  // Project matching notification to freelancers
  async sendProjectMatch(freelancerEmail, freelancerName, project, matchingTags) {
    const subject = `🎯 New Project Match: ${project.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .project-card { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
          .tags { margin: 15px 0; }
          .tag { display: inline-block; padding: 5px 12px; background: #ddd6fe; color: #5b21b6; border-radius: 15px; margin: 3px; font-size: 12px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎯 Perfect Match Found!</h1>
          </div>
          <div class="content">
            <p>Hi ${freelancerName},</p>
            <p>We found a project that matches your skills:</p>
            <div class="project-card">
              <h2 style="margin-top: 0; color: #1f2937;">${project.title}</h2>
              <p style="color: #4b5563;">${project.description.substring(0, 200)}${project.description.length > 200 ? '...' : ''}</p>
              <div style="margin: 15px 0;">
                <strong>💰 Budget:</strong> $${project.budget.toLocaleString()}<br/>
                <strong>📅 Deadline:</strong> ${new Date(project.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div class="tags">
                <strong>Matching Skills:</strong><br/>
                ${matchingTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            </div>
            <p>This project matches ${matchingTags.length} of your listed skills. Don't miss this opportunity!</p>
            <a href="${process.env.FRONTEND_URL}/projects/${project._id}" class="button">
              View Project & Apply →
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br/><strong>Freelance Portal Team</strong></p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Freelance Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: freelancerEmail,
      subject,
      html,
      text: `New project matching your skills: ${project.title}. Budget: $${project.budget}. Apply now!`
    });
  }

  // Deadline reminder
  async sendDeadlineReminder(userEmail, userName, taskOrProject, hoursRemaining, type = 'task') {
    const subject = `⏰ Deadline Reminder: ${taskOrProject.title}`;
    const urgencyColor = hoursRemaining <= 24 ? '#ef4444' : '#f59e0b';
    const urgencyGradient = hoursRemaining <= 24 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    const timeText = hoursRemaining <= 24 ? `${hoursRemaining} hours` : `${Math.floor(hoursRemaining / 24)} days`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${urgencyGradient}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .alert-box { background: #fef3c7; padding: 20px; border-left: 4px solid ${urgencyColor}; border-radius: 4px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: ${urgencyColor}; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
          .countdown { font-size: 36px; font-weight: bold; color: ${urgencyColor}; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">⏰ Deadline Approaching!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>This is an important reminder about your ${type} deadline:</p>
            <div class="alert-box">
              <h2 style="margin-top: 0; color: #1f2937;">${taskOrProject.title}</h2>
              <div class="countdown">${timeText} remaining</div>
              <p style="color: #4b5563; margin-bottom: 0;"><strong>Deadline:</strong> ${new Date(taskOrProject.deadline).toLocaleString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <p>${hoursRemaining <= 24 ? '🚨 <strong>Urgent!</strong>' : '⚠️'} Please ensure you complete this ${type} on time to maintain project progress and meet client expectations.</p>
            <a href="${process.env.FRONTEND_URL}/projects/${taskOrProject.project || taskOrProject._id}" class="button">
              Go to ${type === 'task' ? 'Task' : 'Project'} →
            </a>
          </div>
          <div class="footer">
            <p>Best regards,<br/><strong>Freelance Portal Team</strong></p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Freelance Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text: `Deadline reminder: ${taskOrProject.title} is due in ${timeText}! Please complete it on time.`
    });
  }

  // Batch send project matches to multiple freelancers
  async sendBatchProjectMatches(project, freelancers) {
    const promises = freelancers.map(freelancer => 
      this.sendProjectMatch(
        freelancer.email,
        freelancer.name,
        project,
        freelancer.matchingTags
      )
    );
    
    return await Promise.allSettled(promises);
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service test successful');
      return true;
    } catch (error) {
      console.error('❌ Email service test failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();