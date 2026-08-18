const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// ============================================
// EMAIL CONFIGURATION
// ============================================

// Create transporter
const createTransporter = () => {
    // For SendGrid
    if (process.env.SENDGRID_API_KEY) {
        return nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        });
    }

    // For SMTP (Gmail, etc.)
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    // For development - console only
    return {
        sendMail: (mailOptions) => {
            console.log('📧 Email sent (development mode):', mailOptions);
            return Promise.resolve({ messageId: 'dev-' + Date.now() });
        }
    };
};

const transporter = createTransporter();

// ============================================
// EMAIL TEMPLATES
// ============================================

// Send welcome email
const sendWelcomeEmail = async (email, name, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .button { display: inline-block; background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛍️ QAMSHORAH STORE</h1>
                </div>
                <div class="content">
                    <h2>Welcome to QAMSHORAH STORE!</h2>
                    <p>Hi ${name},</p>
                    <p>Thank you for creating an account with us. We're excited to have you on board!</p>
                    <p>Please verify your email address by clicking the button below:</p>
                    <p style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verify Email</a>
                    </p>
                    <p>If you didn't create an account, please ignore this email.</p>
                    <p>Best regards,<br>The QAMSHORAH STORE Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 QAMSHORAH STORE. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: 'Welcome to QAMSHORAH STORE - Verify Your Email',
        html
    });
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .button { display: inline-block; background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛍️ QAMSHORAH STORE</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${name},</p>
                    <p>We received a request to reset your password. Click the button below to set a new password:</p>
                    <p style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>Best regards,<br>The QAMSHORAH STORE Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 QAMSHORAH STORE. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: 'Reset Your Password - QAMSHORAH STORE',
        html
    });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, name, order) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .order-details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛍️ QAMSHORAH STORE</h1>
                </div>
                <div class="content">
                    <h2>Order Confirmation</h2>
                    <p>Hi ${name},</p>
                    <p>Thank you for your order! We've received your order and are processing it.</p>
                    
                    <div class="order-details">
                        <h3>Order #${order.order_number}</h3>
                        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        <p><strong>Total:</strong> $${order.total_price.toFixed(2)}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                    </div>
                    
                    <h3>Order Items</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.product_name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.product_price.toFixed(2)}</td>
                                    <td>$${item.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <h3>Shipping Address</h3>
                    <p>${order.shipping_address.address_line1}<br>
                    ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}<br>
                    ${order.shipping_address.country}</p>
                    
                    <p>We'll send you another email when your order ships.</p>
                    <p>Best regards,<br>The QAMSHORAH STORE Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 QAMSHORAH STORE. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: `Order Confirmation #${order.order_number}`,
        html
    });
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (email, name, order, status, note) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .order-details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .status { color: #e94560; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛍️ QAMSHORAH STORE</h1>
                </div>
                <div class="content">
                    <h2>Order Status Update</h2>
                    <p>Hi ${name},</p>
                    <p>Your order #${order.order_number} has been updated.</p>
                    
                    <div class="order-details">
                        <p><strong>New Status:</strong> <span class="status">${status}</span></p>
                        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
                        <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        <p><strong>Total:</strong> $${order.total_price.toFixed(2)}</p>
                    </div>
                    
                    <p>Track your order status anytime in your account.</p>
                    <p>Best regards,<br>The QAMSHORAH STORE Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 QAMSHORAH STORE. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: `Order #${order.order_number} Status: ${status}`,
        html
    });
};

// Send generic email
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const mailOptions = {
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@qamshorahstore.com',
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '')
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// EXPORT ALL EMAIL FUNCTIONS
// ============================================

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail
};