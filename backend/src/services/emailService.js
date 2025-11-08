// backend/src/services/emailService.js - UPDATED TEMPLATES
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"FreelanceHub" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html || options.message,
      text: options.message
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

const emailTemplates = {
  applicationReceived: ({ applicantName, projectTitle, clientName, projectId, hasResume }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .resume-badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; display: inline-block; }
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
          ${hasResume ? '<p><span class="resume-badge">📄 Resume Attached</span></p>' : ''}
          <p>Review their ${hasResume ? 'profile, resume,' : 'profile'} and application message to decide if they're a good fit for your team.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/projects/${projectId}" class="button">Review Application</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  applicationApproved: ({ applicantName, projectTitle, clientName, projectId }) => `
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
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/projects/${projectId}" class="button">Go to Project</a>
          <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 5px;">
            <p style="margin: 0; color: #075985;"><strong>Next Steps:</strong></p>
            <ul style="color: #075985; margin: 10px 0 0 0;">
              <li>View project tasks and milestones</li>
              <li>Communicate with team members</li>
              <li>Start contributing to the project</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  applicationRejected: ({ applicantName, projectTitle }) => `
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
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/projects" class="button">Browse More Projects</a>
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 5px;">
            <p style="margin: 0; color: #92400e;"><strong>Tips for Future Applications:</strong></p>
            <ul style="color: #92400e; margin: 10px 0 0 0;">
              <li>Highlight relevant skills and experience</li>
              <li>Keep your resume updated</li>
              <li>Write personalized application messages</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

module.exports = { sendEmail, emailTemplates };