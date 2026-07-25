const getInviteEmailTemplate = (name, email, password, loginUrl) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Krishna Tent & Events</title>
    <style>
      body {
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #F8F9FA;
        margin: 0;
        padding: 0;
        color: #18181B;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #F1F5F9;
      }
      .header {
        background-color: #18181B;
        padding: 32px 24px;
        text-align: center;
        border-bottom: 4px solid #D97706;
      }
      .header h1 {
        color: #FBBF24;
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }
      .content {
        padding: 40px 32px;
      }
      .content p {
        font-size: 16px;
        line-height: 1.6;
        margin: 0 0 20px 0;
        color: #3F3F46;
      }
      .credentials-box {
        background-color: #FFFBEB;
        border: 1px solid #FDE68A;
        border-radius: 12px;
        padding: 24px;
        margin: 32px 0;
      }
      .credentials-box h3 {
        margin: 0 0 16px 0;
        color: #92400E;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .credential-row {
        margin-bottom: 12px;
      }
      .credential-label {
        font-size: 12px;
        color: #B45309;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
        display: block;
        margin-bottom: 4px;
      }
      .credential-value {
        font-size: 16px;
        font-weight: 700;
        color: #18181B;
        background-color: #ffffff;
        padding: 10px 14px;
        border-radius: 6px;
        border: 1px solid #FCD34D;
        display: block;
      }
      .button-container {
        text-align: center;
        margin-top: 32px;
      }
      .button {
        background-color: #D97706;
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        display: inline-block;
        transition: background-color 0.2s;
      }
      .button:hover {
        background-color: #B45309;
      }
      .footer {
        background-color: #F8F9FA;
        padding: 24px;
        text-align: center;
        font-size: 14px;
        color: #71717A;
        border-top: 1px solid #E4E4E7;
      }
      .warning {
        font-size: 13px;
        color: #EF4444;
        margin-top: 24px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Krishna Tent & Events ERP</h1>
      </div>
      
      <div class="content">
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been invited to join the Krishna Tent & Events Management System. Your account has been successfully provisioned by the administration.</p>
        
        <div class="credentials-box">
          <h3>Your Login Credentials</h3>
          
          <div class="credential-row">
            <span class="credential-label">Email Address</span>
            <span class="credential-value">${email}</span>
          </div>
          
          <div class="credential-row">
            <span class="credential-label">Temporary Password</span>
            <span class="credential-value">${password}</span>
          </div>
        </div>
        
        <div class="button-container">
          <a href="${loginUrl}" class="button">Access Dashboard</a>
        </div>
        
        <p class="warning">For security reasons, we strongly recommend changing your password immediately after your first login.</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Krishna Tent & Events. All rights reserved.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  getInviteEmailTemplate,
};
