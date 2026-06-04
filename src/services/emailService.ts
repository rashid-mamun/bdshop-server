import nodemailer from 'nodemailer';
import environment from '../config/environment';
import { logger } from '../utils/logger';

type EmailInput = {
    to: string;
    subject: string;
    text: string;
    html?: string;
};

const hasSmtpConfig = () =>
    environment.NODE_ENV !== 'test' &&
    Boolean(environment.SMTP_HOST && environment.SMTP_USER && environment.SMTP_PASS);

const createTransport = () =>
    nodemailer.createTransport({
        host: environment.SMTP_HOST,
        port: environment.SMTP_PORT,
        secure: environment.SMTP_PORT === 465,
        auth: {
            user: environment.SMTP_USER,
            pass: environment.SMTP_PASS,
        },
    });

export const sendEmail = async ({ to, subject, text, html }: EmailInput) => {
    if (!hasSmtpConfig()) {
        logger.info('Email skipped because SMTP is not configured', { to, subject, text });
        return { delivered: false, preview: text };
    }

    try {
        const transport = createTransport();
        await transport.sendMail({
            from: environment.EMAIL_FROM,
            to,
            subject,
            text,
            html,
        });
        return { delivered: true };
    } catch (error) {
        logger.error('Email delivery failed', {
            to,
            subject,
            error: error instanceof Error ? error.message : String(error),
        });
        return { delivered: false, error: error instanceof Error ? error.message : String(error) };
    }
};

export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
    const resetUrl = `${environment.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    return sendEmail({
        to,
        subject: 'Reset your BD Shop password',
        text: `Reset your password using this link: ${resetUrl}. This link expires in 30 minutes.`,
        html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
    });
};

export const sendOrderConfirmationEmail = async (to: string, orderId: string, total: number) =>
    sendEmail({
        to,
        subject: 'BD Shop order confirmation',
        text: `Your order ${orderId} has been placed. Total: BDT ${total.toLocaleString()}.`,
    });

export const sendReturnRequestEmail = async (to: string, requestId: string) =>
    sendEmail({
        to,
        subject: 'BD Shop return request received',
        text: `Your return request ${requestId} has been received. We will review it shortly.`,
    });
