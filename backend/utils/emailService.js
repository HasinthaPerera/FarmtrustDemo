const nodemailer = require('nodemailer');

// ── Nodemailer transporter (Gmail + App Password) ────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Gmail App Password, not your account password
  },
});

// ── Helper: build branded HTML email for OTP ─────────────────────────────────
function buildOTPEmail(name, otp) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>FarmTrust – Email Verification</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:36px 48px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🌿 FarmTrust</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Connecting Farmers &amp; Buyers Across Sri Lanka</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:600;">Verify your email address</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Hi <strong>${name}</strong>, welcome to FarmTrust! Use the one-time code below to complete your registration.
                This code is valid for <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:10px;padding:28px;text-align:center;margin:0 0 28px;">
                <p style="margin:0 0 6px;color:#15803d;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Your Verification Code</p>
                <p style="margin:0;color:#14532d;font-size:42px;font-weight:800;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
              </div>

              <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email — someone may have typed your address by mistake.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                For security, never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 48px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} FarmTrust · Sri Lanka · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

// ── New: build branded HTML email for New Listing Alert ──────────────────────
function buildNewListingEmail(buyerName, productDetails) {
  const { cropName, quantity, price, farmerName } = productDetails;
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>FarmTrust – New Listing Alert</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:36px 48px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🌿 FarmTrust</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Connecting Farmers &amp; Buyers Across Sri Lanka</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:600;">Fresh produce alert!</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Hi <strong>${buyerName}</strong>, a new listing for <strong>${cropName}</strong> just dropped in your area.
              </p>

              <!-- Listing Box -->
              <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:24px;margin:0 0 28px;text-align:left;">
                <p style="margin:0 0 12px;color:#15803d;font-size:14px;font-weight:600;text-transform:uppercase;">Listing Details:</p>
                <ul style="list-style:none;padding:0;margin:0;color:#1e293b;font-size:16px;">
                  <li style="margin-bottom:8px;"><strong>Crop:</strong> ${cropName}</li>
                  <li style="margin-bottom:8px;"><strong>Quantity:</strong> ${quantity} kg</li>
                  <li style="margin-bottom:8px;"><strong>Price:</strong> Rs. ${price} / kg</li>
                  <li style="margin-bottom:0;"><strong>Farmer:</strong> ${farmerName}</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin:0 0 24px;">
                <a href="http://localhost:3000/login" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:8px;box-shadow:0 4px 12px rgba(22,163,74,0.3);">
                  View & Claim Now
                </a>
              </div>

              <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
                Log in to FarmTrust to claim it before it's gone! Good quality produce sells out fast.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 48px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} FarmTrust · Sri Lanka · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

// ── Exported Services ────────────────────────────────────────────────────────

async function sendOTPEmail(email, name, otp) {
  return transporter.sendMail({
    from: `"FarmTrust" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your FarmTrust Verification Code',
    html: buildOTPEmail(name, otp),
  });
}

async function sendNewListingAlert(email, buyerName, productDetails) {
  const { cropName } = productDetails;
  return transporter.sendMail({
    from: `"FarmTrust Alerts" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🌱 Fresh ${cropName} just listed in your area!`,
    html: buildNewListingEmail(buyerName, productDetails),
  });
}

module.exports = {
  sendOTPEmail,
  sendNewListingAlert
};
