// src/templates/email.templates.ts

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export class EmailTemplates {
  static forgotPassword(username: string, newPassword: string): EmailTemplate {
    const subject = "234Hire - New Password";

    const text = `
Hello ${username},

We received a request to reset your password for your 234Hire account.

Your new temporary password is: ${newPassword}

Please login with this new password and change it immediately for security purposes.

If you didn't request this password reset, please contact our support team immediately.

Best regards,
234Hire Team
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">234Hire - Password Reset</h2>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>We received a request to reset your password for your 234Hire account.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">Your new temporary password is:</p>
          <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #7c3aed; font-family: monospace;">${newPassword}</p>
        </div>
        
        <p style="color: #dc2626; font-weight: bold;">⚠️ Please login with this new password and change it immediately for security purposes.</p>
        
        <p>If you didn't request this password reset, please contact our support team immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>234Hire Team</strong>
        </p>
      </div>
    `;

    return { subject, text, html };
  }

  static forgotPasswordOTP(username: string, otp: string): EmailTemplate {
    const subject = "234Hire - Password Reset Code";

    const text = `
Hello ${username},

We received a request to reset your password for your 234Hire account.

Your password reset code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email.

Best regards,
234Hire Team
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">234Hire - Password Reset</h2>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>We received a request to reset your password for your 234Hire account.</p>
        
        <div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 18px; color: #6b7280;">Password Reset Code</p>
          <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #7c3aed; font-family: monospace; letter-spacing: 8px;">${otp}</p>
        </div>
        
        <p style="color: #dc2626; font-weight: bold;">⏰ This code will expire in 10 minutes.</p>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>234Hire Team</strong>
        </p>
      </div>
    `;

    return { subject, text, html };
  }

  static verificationOTP(username: string, otp: string): EmailTemplate {
    const subject = "234Hire - Email Verification Code";

    const text = `
Hello ${username},

Your email verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this verification, please ignore this email.

Best regards,
234Hire Team
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">234Hire - Email Verification</h2>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Your email verification code is:</p>
        
        <div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 18px; color: #6b7280;">Verification Code</p>
          <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #7c3aed; font-family: monospace; letter-spacing: 8px;">${otp}</p>
        </div>
        
        <p style="color: #dc2626; font-weight: bold;">⏰ This code will expire in 10 minutes.</p>
        
        <p>If you didn't request this verification, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>234Hire Team</strong>
        </p>
      </div>
    `;

    return { subject, text, html };
  }

  static welcomeEmail(username: string): EmailTemplate {
    const subject = "Welcome to 234Hire!";

    const text = `
Hello ${username},

Welcome to 234Hire! We're excited to have you join our community.

Start exploring opportunities and connecting with top talent and recruiters.

Best regards,
234Hire Team
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Welcome to 234Hire!</h2>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Welcome to 234Hire! We're excited to have you join our community.</p>
        
        <p>Start exploring opportunities and connecting with top talent and recruiters.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>234Hire Team</strong>
        </p>
      </div>
    `;

    return { subject, text, html };
  }

  static passwordChanged(username: string): EmailTemplate {
    const subject = "234Hire - Password Changed";

    const text = `
Hello ${username},

Your password has been successfully changed.

If you didn't make this change, please contact our support team immediately.

Best regards,
234Hire Team
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">234Hire - Password Changed</h2>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Your password has been successfully changed.</p>
        
        <p style="color: #dc2626;">If you didn't make this change, please contact our support team immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>234Hire Team</strong>
        </p>
      </div>
    `;

    return { subject, text, html };
  }
}
