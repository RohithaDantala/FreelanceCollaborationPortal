require('dotenv').config(); // loads .env

const nodemailer = require('nodemailer');

// Create transporter using Gmail (you can use other services too)
const transporter = nodemailer.createTransport({  // <-- CHANGE THIS
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your-email@gmail.com
    pass: process.env.EMAIL_PASSWORD // your app password
  }
});


// Alternative: Using SMTP directly
// const transporter = nodemailer.createTransporter({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

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
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw error - just log it so app continues working
    return { success: false, error: error.message };
  }
};

// Email Templates
const emailTemplates = {
  welcome: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Welcome to FreelanceHub!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining FreelanceHub. We're excited to have you on board!</p>
      <p>Get started by:</p>
      <ul>
        <li>Completing your profile</li>
        <li>Browsing available projects</li>
        <li>Connecting with other freelancers</li>
      </ul>
      <p>Best regards,<br>The FreelanceHub Team</p>
    </div>
  `,
  
  applicationReceived: (projectTitle, applicantName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">New Application Received</h2>
      <p>You have received a new application for your project:</p>
      <p><strong>${projectTitle}</strong></p>
      <p>From: <strong>${applicantName}</strong></p>
      <p>Please log in to review the application.</p>
      <a href="${process.env.FRONTEND_URL}/my-projects" 
         style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
        Review Application
      </a>
    </div>
  `,
  
  applicationAccepted: (projectTitle) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Application Accepted! 🎉</h2>
      <p>Congratulations! Your application has been accepted for:</p>
      <p><strong>${projectTitle}</strong></p>
      <p>You can now access the project tasks, files, and collaborate with the team.</p>
      <a href="${process.env.FRONTEND_URL}/my-projects" 
         style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
        View Project
      </a>
    </div>
  `,
  
  paymentCreated: (amount, projectTitle) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Payment Created 💰</h2>
      <p>A new payment has been created:</p>
      <p><strong>Amount:</strong> $${amount}</p>
      <p><strong>Project:</strong> ${projectTitle}</p>
      <p>Log in to view payment details.</p>
      <a href="${process.env.FRONTEND_URL}/my-projects" 
         style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
        View Payments
      </a>
    </div>
  `
};

module.exports = { sendEmail, emailTemplates };

