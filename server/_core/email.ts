import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@skycoin4444.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${process.env.VITE_FRONTEND_URL}/verify-email?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: 'SKYCOIN4444 <noreply@skycoin4444.com>',
      to: email,
      subject: 'Verify Your Email - SKYCOIN4444',
      html: `
        <h2>Welcome to SKYCOIN4444!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationLink}</p>
        <p>This link expires in 24 hours.</p>
      `,
    });
    return true;
  } catch (error) {
        return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await transporter.sendMail({
      from: 'SKYCOIN4444 <noreply@skycoin4444.com>',
      to: email,
      subject: 'Welcome to SKYCOIN4444!',
      html: `
        <h2>Welcome ${name}!</h2>
        <p>Your account has been verified and is now active.</p>
        <p>Start trading, chat with AI, and explore the ecosystem.</p>
        <a href="${process.env.VITE_FRONTEND_URL}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Platform
        </a>
      `,
    });
    return true;
  } catch (error) {
        return false;
  }
}
