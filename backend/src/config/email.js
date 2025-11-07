const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For production: use real SMTP (Gmail, SendGrid, etc.)
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development: use Ethereal (test email service)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
      pass: process.env.SMTP_PASS || 'ethereal.password',
    },
  });
};

// Email templates
const emailTemplates = {
  applicationReceived: ({ applicantName, projectTitle, clientName }) => ({
    subject: `New Application for "${projectTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 New Project Application</h1>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p><strong>${applicantName}</strong> has applied to join your project:</p>
            <h2 style="color: #667eea;">"${projectTitle}"</h2>
            <p>Review their profile and application message to decide if they're a good fit for your team.</p>
            <a href="${process.env.CLIENT_URL}/projects/${projectId}" class="button">Review Application</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  applicationApproved: ({ applicantName, projectTitle, clientName }) => ({
    subject: `✅ Your application for "${projectTitle}" was approved!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <p>Hi ${applicantName},</p>
            <p>Great news! <strong>${clientName}</strong> has approved your application to join:</p>
            <h2 style="color: #10b981;">"${projectTitle}"</h2>
            <p>You're now part of the team! Start collaborating and delivering amazing work.</p>
            <a href="${process.env.CLIENT_URL}/projects/${projectId}" class="button">Go to Project</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  applicationRejected: ({ applicantName, projectTitle }) => ({
    subject: `Update on your application for "${projectTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Update</h1>
          </div>
          <div class="content">
            <p>Hi ${applicantName},</p>
            <p>Thank you for your interest in "<strong>${projectTitle}</strong>".</p>
            <p>After careful consideration, the project owner has decided to move forward with other candidates at this time.</p>
            <p>Don't be discouraged! There are many other exciting projects waiting for your skills.</p>
            <a href="${process.env.CLIENT_URL}/projects" class="button">Browse More Projects</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  projectCreated: ({ freelancerName, projectTitle, clientName, skills }) => ({
    subject: `🚀 New Project Match: "${projectTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .skills { display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0; }
          .skill-tag { background: #dbeafe; color: #1e40af; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Project Match!</h1>
          </div>
          <div class="content">
            <p>Hi ${freelancerName},</p>
            <p>A new project matching your skills has been posted by <strong>${clientName}</strong>:</p>
            <h2 style="color: #667eea;">"${projectTitle}"</h2>
            <p><strong>Required Skills:</strong></p>
            <div class="skills">
              ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <p>This project matches your expertise. Don't miss this opportunity!</p>
            <a href="${process.env.CLIENT_URL}/projects/${projectId}" class="button">View Project Details</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  deadlineReminder: ({ userName, projectTitle, deadline, daysLeft }) => ({
    subject: `⏰ Reminder: "${projectTitle}" deadline approaching`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Deadline Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <div class="warning-box">
              <p><strong>Project:</strong> "${projectTitle}"</p>
              <p><strong>Deadline:</strong> ${deadline}</p>
              <p><strong>Time Remaining:</strong> ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</p>
            </div>
            <p>The deadline is approaching! Make sure you're on track to complete your deliverables on time.</p>
            <a href="${process.env.CLIENT_URL}/projects/${projectId}" class="button">View Project</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  interviewScheduled: ({ userName, projectTitle, date, time, meetingLink }) => ({
    subject: `📅 Interview Scheduled for "${projectTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Interview Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your interview has been scheduled for:</p>
            <h2 style="color: #8b5cf6;">"${projectTitle}"</h2>
            <div class="info-box">
              <p><strong>📅 Date:</strong> ${date}</p>
              <p><strong>🕐 Time:</strong> ${time}</p>
              ${meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
            </div>
            <p>Please make sure to join on time. Good luck!</p>
            ${meetingLink ? `<a href="${meetingLink}" class="button">Join Meeting</a>` : ''}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
const sendEmail = async (to, template) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"FreelanceHub" <${process.env.SMTP_USER || 'noreply@freelancehub.com'}>`,
      to,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', info.messageId);
    
    // If using Ethereal, log preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw error;
  }
};

module.exports = { sendEmail, emailTemplates };