// src/services/email.service.ts
import nodemailer from "nodemailer";
import env from "../config/env";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Create a transporter with enhanced configuration
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED,
    },
    // Gmail specific settings
    ...(env.SMTP_HOST === "smtp.gmail.com" && {
      service: "gmail",
    }),
  });

  // Define email options
  const mailOptions = {
    from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log("📧 SMTP Server connection verified");

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);

    // Log additional info for Gmail
    if (env.SMTP_HOST === "smtp.gmail.com") {
      console.log(`📧 Gmail delivery status: ${info.response}`);
    }
  } catch (error: any) {
    console.error(`❌ Error sending email:`, error.message);

    // Provide helpful error messages
    if (error.code === "EAUTH") {
      console.error("🔐 Authentication failed. Check your email credentials.");
      console.error(
        "💡 For Gmail: Make sure you're using an App Password, not your regular password."
      );
    } else if (error.code === "ECONNECTION") {
      console.error("🌐 Connection failed. Check your SMTP settings.");
    } else if (error.code === "EMESSAGE") {
      console.error("📝 Message error. Check your email content.");
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
};
