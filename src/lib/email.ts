import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // Enable debug output
})

// Verify SMTP connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Verification Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

export async function sendVerificationCode(email: string, code: string) {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Your Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a; text-align: center;">Login Verification Code</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #2563eb; margin: 0;">${code}</h1>
        </div>
        <p style="color: #4b5563; text-align: center;">
          This code will expire in 5 minutes.<br>
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  }

  try {
    console.log('Attempting to send email to:', email);
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.response);
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    // Log detailed error information
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    return false
  }
} 