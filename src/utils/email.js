const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: "Rock'n Rate <info@rocknrate.org>",
    to: email,
    subject: subject,
    html: html,
  });
};

const activationTemplate = (username, userId, activationCode) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activation Code</title>
    <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #1d1d1d;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background-color: #1d1d1d;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #6ac045;
        }
        .content {
          font-size: 16px;
          line-height: 1.5;
          color: #919191;
        }
        .content a {
          color: #6ac045;
          text-decoration: none;
        }
        .link-container {
          display: flex;
          justify-content: center;
        }
        .link {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin: 16px 0;
          padding: 10px 20px;
          background-color: #6ac045;
          color: #fff;
          border-radius: 5px;
          text-decoration: none;
        }
        .footer {
          font-size: 14px;
          color: #919191;
          text-align: center;
          margin-top: 20px;
        }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Rock'n Rate!</h1>
        </div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>Thank you for registering with Rock'n Rate. To complete your registration, please click the activation link below:</p>
          <div class="link-container">
            <a href="${process.env.UI_URL}/activation?id=${userId}&code=${activationCode}" class="link" style="color:#fff;">Activate Your Account</a>
          </div>
          <p>If you did not request this activation code, please ignore this email.</p>
          <p>If you have any questions or need further assistance, feel free to <a href="mailto:info@rocknrate.org" style="color:#6ac045;">contact us</a>.</p>
        </div>
        <div class="footer">
          <p>Best regards</p>
        </div>
      </div>
    </body>
    </html>
    `
};

const resetPasswordTemplate = (username, refreshPasswordToken) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #1d1d1d;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background-color: #1d1d1d;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #6ac045;
        }
        .content {
          font-size: 16px;
          line-height: 1.5;
          color: #919191;
        }
        .content a {
          color: #6ac045;
          text-decoration: none;
        }
        .link-container {
          display: flex;
          justify-content: center;
        }
        .link {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin: 16px 0;
          padding: 10px 20px;
          background-color: #6ac045;
          color: #fff;
          border-radius: 5px;
          text-decoration: none;
        }
        .footer {
          font-size: 14px;
          color: #919191;
          text-align: center;
          margin-top: 20px;
        }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hello ${username},</p>
          <p>We received a request to reset your password. To proceed, please click the link below:</p>
          <div class="link-container">
            <a href="${process.env.UI_URL}/reset-password/${refreshPasswordToken}" class="link" style="color:#fff;">Reset Password</a>
          </div>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p>If you have any questions or need further assistance, feel free to <a href="mailto:info@rocknrate.org" style="color:#6ac045;">contact us</a>.</p>
        </div>
        <div class="footer">
          <p>Best regards</p>
        </div>
      </div>
    </body>
    </html>
    `;
};


module.exports = { sendEmail, activationTemplate, resetPasswordTemplate };