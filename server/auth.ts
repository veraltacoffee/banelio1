import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './db';

const COOKIE_NAME = 'banelio_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const TWO_FACTOR_CHALLENGE_TTL_SECONDS = 5 * 60;

const EMAIL_VERIFICATION_TTL_SECONDS = 15 * 60;
const PASSWORD_RESET_TTL_SECONDS = 15 * 60;

function getMailTransport() {
  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT || 587);
  const secure = port === 465 && String(process.env.MAIL_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.MAIL_USER;
  const password = process.env.MAIL_PASSWORD;

  if (!host || !user || !password) {
    throw new Error('SMTP no está configurado completamente.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: password,
    },
  });
}

function newEmailVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

async function createEmailVerificationToken(customerId: string): Promise<string> {
  const code = newEmailVerificationCode();
  const tokenHash = hashToken(code);

  await prisma.emailVerificationToken.deleteMany({
    where: { customerId },
  });

  await prisma.emailVerificationToken.create({
    data: {
      id: crypto.randomUUID(),
      customerId,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000),
    },
  });

  return code;
}

async function sendEmailVerificationCode(
  customer: { email: string; name: string },
  code: string,
): Promise<void> {
  const transport = getMailTransport();
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;

  if (!from) {
    throw new Error('MAIL_FROM no está configurado.');
  }

  await transport.sendMail({
    from,
    to: customer.email,
    subject: 'Verifica tu correo electrónico — BANELIO',
    text: [
      `Hola ${customer.name},`,
      '',
      'Tu código de verificación de BANELIO es:',
      '',
      code,
      '',
      'Este código vence en 15 minutos.',
      'Si no solicitaste esta verificación, puedes ignorar este mensaje.',
      '',
      'BANELIO',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#111;">
        <h2>Verifica tu correo electrónico</h2>
        <p>Hola ${customer.name},</p>
        <p>Tu código de verificación de BANELIO es:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px 0;">
          ${code}
        </div>
        <p>Este código vence en 15 minutos.</p>
        <p>Si no solicitaste esta verificación, puedes ignorar este mensaje.</p>
        <p>BANELIO</p>
      </div>
    `,
  });
}

function newPasswordResetCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

async function createPasswordResetToken(customerId: string): Promise<string> {
  const code = newPasswordResetCode();
  const tokenHash = hashToken(code);

  await prisma.passwordResetToken.deleteMany({
    where: { customerId },
  });

  await prisma.passwordResetToken.create({
    data: {
      id: crypto.randomUUID(),
      customerId,
      tokenHash,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000),
    },
  });

  return code;
}

async function sendPasswordResetCode(
  customer: { email: string; name: string },
  code: string,
): Promise<void> {
  const transport = getMailTransport();
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;

  if (!from) {
    throw new Error('MAIL_FROM no está configurado.');
  }

  await transport.sendMail({
    from,
    to: customer.email,
    subject: 'Recuperación de contraseña — BANELIO',
    text: [
      `Hola ${customer.name},`,
      '',
      'Tu código para restablecer la contraseña de BANELIO es:',
      '',
      code,
      '',
      'Este código vence en 15 minutos.',
      'Si no solicitaste recuperar tu contraseña, puedes ignorar este mensaje.',
      '',
      'BANELIO',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#111;">
        <h2>Recuperación de contraseña</h2>
        <p>Hola ${customer.name},</p>
        <p>Tu código para restablecer la contraseña de BANELIO es:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px 0;">
          ${code}
        </div>
        <p>Este código vence en 15 minutos.</p>
        <p>Si no solicitaste recuperar tu contraseña, puedes ignorar este mensaje.</p>
        <p>BANELIO</p>
      </div>
    `,
  });
}

export async function requestPasswordResetAuth(
  req: Request,
  res: Response,
) {
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'El correo electrónico no es válido.',
    });
  }

  const customer = await prisma.customer.findUnique({
    where: { email },
  });

  // Respuesta uniforme para no revelar si el correo está registrado.
  if (!customer || customer.role !== 'CUSTOMER' || !customer.passwordHash) {
    return res.json({
      success: true,
      sent: true,
    });
  }

  try {
    const code = await createPasswordResetToken(customer.id);

    await sendPasswordResetCode(
      {
        email: customer.email,
        name: customer.name,
      },
      code,
    );

    return res.json({
      success: true,
      sent: true,
    });
  } catch (error) {
    console.error('Error enviando recuperación de contraseña:', error);

    await prisma.passwordResetToken.deleteMany({
      where: { customerId: customer.id },
    }).catch(() => {});

    return res.status(503).json({
      success: false,
      error: 'No se pudo enviar el correo de recuperación.',
    });
  }
}

export async function resetPasswordAuth(
  req: Request,
  res: Response,
) {
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';
  const code = typeof req.body?.code === 'string'
    ? req.body.code.trim()
    : '';
  const password = typeof req.body?.password === 'string'
    ? req.body.password
    : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'El correo electrónico no es válido.',
    });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      error: 'El código debe contener 6 dígitos.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 8 caracteres.',
    });
  }

  const customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (!customer || !customer.passwordHash || customer.role !== 'CUSTOMER') {
    return res.status(400).json({
      success: false,
      error: 'El código de recuperación no es válido o ha expirado.',
    });
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      customerId: customer.id,
      tokenHash: hashToken(code),
    },
  });

  const activeResetToken = await prisma.passwordResetToken.findFirst({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
  });

  if (activeResetToken && activeResetToken.id !== resetToken?.id) {
    return res.status(400).json({
      success: false,
      error: 'El código de recuperación no es válido o ha expirado.',
    });
  }

  if (!resetToken || resetToken.expiresAt <= new Date()) {
    if (activeResetToken && activeResetToken.expiresAt > new Date()) {
      const failedAttempts = activeResetToken.failedAttempts + 1;

      if (failedAttempts >= 5) {
        await prisma.passwordResetToken.delete({
          where: { id: activeResetToken.id },
        }).catch(() => {});
      } else {
        await prisma.passwordResetToken.update({
          where: { id: activeResetToken.id },
          data: { failedAttempts },
        }).catch(() => {});
      }
    }

    return res.status(400).json({
      success: false,
      error: 'El código de recuperación no es válido o ha expirado.',
    });
  }

  if (resetToken.failedAttempts >= 5) {
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    }).catch(() => {});

    return res.status(400).json({
      success: false,
      error: 'El código de recuperación no es válido o ha expirado.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    }),
    prisma.session.deleteMany({
      where: { customerId: customer.id },
    }),
  ]);

  return res.json({
    success: true,
    passwordReset: true,
  });
}

export async function sendEmailVerificationAuth(
  req: Request,
  res: Response,
) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer) {
    return res.status(401).json({
      success: false,
      error: 'Debes iniciar sesión.',
    });
  }

  if (customer.emailVerified) {
    return res.json({
      success: true,
      alreadyVerified: true,
    });
  }

  try {
    const code = await createEmailVerificationToken(customer.id);

    await sendEmailVerificationCode(
      {
        email: customer.email,
        name: customer.name,
      },
      code,
    );

    return res.json({
      success: true,
      sent: true,
    });
  } catch (error) {
    console.error('Error enviando verificación de email:', error);

    await prisma.emailVerificationToken.deleteMany({
      where: { customerId: customer.id },
    }).catch(() => {});

    return res.status(503).json({
      success: false,
      error: 'No se pudo enviar el correo de verificación.',
    });
  }
}

export async function verifyEmailAuth(
  req: Request,
  res: Response,
) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer) {
    return res.status(401).json({
      success: false,
      error: 'Debes iniciar sesión.',
    });
  }

  const code = typeof req.body?.code === 'string'
    ? req.body.code.trim()
    : '';

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      error: 'El código debe contener 6 dígitos.',
    });
  }

  const verification = await prisma.emailVerificationToken.findFirst({
    where: {
      customerId: customer.id,
      tokenHash: hashToken(code),
    },
  });

  if (!verification || verification.expiresAt <= new Date()) {
    if (verification) {
      await prisma.emailVerificationToken.delete({
        where: { id: verification.id },
      }).catch(() => {});
    }

    return res.status(401).json({
      success: false,
      error: 'El código es inválido o ha expirado.',
    });
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      emailVerified: true,
      status: customer.status === 'PENDING_VERIFICATION'
        ? 'ACTIVE'
        : customer.status,
    },
  });

  await prisma.emailVerificationToken.deleteMany({
    where: { customerId: customer.id },
  });

  return res.json({
    success: true,
    verified: true,
    user: publicCustomer(updatedCustomer),
  });
}


const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = input.replace(/=+$/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) throw new Error('Base32 inválido.');

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function generateTotpCode(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = crypto
    .createHmac('sha1', key)
    .update(buffer)
    .digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(TOTP_DIGITS, '0');
}

function verifyTotpCode(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;

  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

  for (let offset = -1; offset <= 1; offset += 1) {
    const expected = generateTotpCode(secret, counter + offset);

    if (crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(code),
    )) {
      return true;
    }
  }

  return false;
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
}

function buildTotpUri(email: string, secret: string): string {
  const issuer = 'Banelio';
  const label = `${issuer}:${email}`;

  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}


function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function newToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

async function createTwoFactorChallenge(customerId: string): Promise<string> {
  const token = newToken();
  const id = hashToken(token);
  await prisma.pendingTwoFactorAuth.deleteMany({ where: { customerId } });
  await prisma.pendingTwoFactorAuth.create({
    data: {
      id,
      customerId,
      expiresAt: new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_SECONDS * 1000),
    },
  });
  return token;
}

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;

    const key = part.slice(0, index).trim();
    if (key !== name) continue;

    return decodeURIComponent(part.slice(index + 1));
  }

  return null;
}

function setSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production';

  const value =
    `${COOKIE_NAME}=${encodeURIComponent(token)}; ` +
    `HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}` +
    (secure ? '; Secure' : '');

  res.setHeader('Set-Cookie', value);
}

function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production';

  const value =
    `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0` +
    (secure ? '; Secure' : '');

  res.setHeader('Set-Cookie', value);
}

function publicCustomer(customer: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}) {
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    role: customer.role,
    status: customer.status,
    emailVerified: customer.emailVerified,
    twoFactorEnabled: customer.twoFactorEnabled,
  };
}

async function createSession(
  req: Request,
  res: Response,
  customerId: string,
): Promise<void> {
  const token = newToken();

  await prisma.session.create({
    data: {
      id: hashToken(token),
      customerId,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      userAgent: req.get('user-agent')?.slice(0, 500) ?? null,
      ip: req.ip?.slice(0, 100) ?? null,
    },
  });

  setSessionCookie(res, token);
}

export async function getAuthenticatedCustomer(
  req: Request,
  touch = true,
) {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { customer: true },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (touch) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return session.customer;
}

export async function registerAuth(req: Request, res: Response) {
  const body = req.body ?? {};

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null;

  if (!name || name.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'El nombre es obligatorio.',
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'El correo electrónico no es válido.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 8 caracteres.',
    });
  }

  const existing = await prisma.customer.findUnique({
    where: { email },
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'El correo electrónico ya está registrado.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: 'CUSTOMER',
      status: 'PENDING_VERIFICATION',
    },
  });

  await createSession(req, res, customer.id);

  return res.status(201).json({
    success: true,
    authenticated: true,
    requiresEmailVerification: true,
    user: publicCustomer(customer),
  });

}

export async function loginAuth(req: Request, res: Response) {
  const body = req.body ?? {};

  const email = typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';
  const password = typeof body.password === 'string'
    ? body.password
    : '';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Correo y contraseña son obligatorios.',
    });
  }

  const customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (!customer?.passwordHash || customer.role !== 'CUSTOMER') {
    return res.status(401).json({
      success: false,
      error: 'Credenciales inválidas.',
    });
  }

  const valid = await bcrypt.compare(password, customer.passwordHash);

  if (!valid) {
    return res.status(401).json({
      success: false,
      error: 'Credenciales inválidas.',
    });
  }

  if (customer.twoFactorEnabled) {
    const challengeToken = await createTwoFactorChallenge(customer.id);

    return res.json({
      success: true,
      authenticated: false,
      requiresTwoFactor: true,
      challengeToken,
      user: publicCustomer(customer),
    });
  }

  await createSession(req, res, customer.id);

  return res.json({
    success: true,
    authenticated: true,
    requiresEmailVerification: !customer.emailVerified,
    user: publicCustomer(customer),
  });
}

export async function logoutAuth(req: Request, res: Response) {
  const token = getCookie(req, COOKIE_NAME);

  if (token) {
    await prisma.session.delete({
      where: { id: hashToken(token) },
    }).catch(() => {});
  }

  clearSessionCookie(res);

  return res.json({
    success: true,
    authenticated: false,
  });
}

export async function meAuth(req: Request, res: Response) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer || customer.role !== 'CUSTOMER') {
    return res.json({
      success: true,
      authenticated: false,
      user: null,
    });
  }

  return res.json({
    success: true,
    authenticated: true,
    user: publicCustomer(customer),
  });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida.',
    });
  }

  res.locals.customer = customer;
  return next();
}

export function requireRole(...roles: string[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const customer = res.locals.customer;

    if (!customer || !roles.includes(customer.role)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes.',
      });
    }

    return next();
  };
}

export async function setupTwoFactorAuth(req: Request, res: Response) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer || customer.role !== 'CUSTOMER') {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida.',
    });
  }

  if (customer.twoFactorEnabled) {
    return res.status(409).json({
      success: false,
      error: 'La autenticación en dos pasos ya está habilitada.',
    });
  }

  const secret = generateTotpSecret();
  const otpauth = buildTotpUri(customer.email, secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  const backupCodes = generateBackupCodes();

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      twoFactorSecret: secret,
      backupCodes: JSON.stringify(backupCodes),
      twoFactorEnabled: false,
    },
  });

  return res.json({
    success: true,
    secret,
    qrCodeUrl,
    backupCodes,
  });
}

export async function verifyTwoFactorSetup(req: Request, res: Response) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer || customer.role !== 'CUSTOMER') {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida.',
    });
  }

  const code = typeof req.body?.code === 'string'
    ? req.body.code.trim()
    : '';

  if (!customer.twoFactorSecret) {
    return res.status(400).json({
      success: false,
      error: 'Primero debe iniciar la configuración de 2FA.',
    });
  }

  if (!verifyTotpCode(customer.twoFactorSecret, code)) {
    return res.status(400).json({
      success: false,
      error: 'Código de autenticación inválido.',
    });
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      twoFactorEnabled: true,
    },
  });

  const updated = await prisma.customer.findUnique({
    where: { id: customer.id },
  });

  return res.json({
    success: true,
    enabled: true,
    user: updated ? publicCustomer(updated) : null,
  });
}

export async function disableTwoFactorAuth(req: Request, res: Response) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer || customer.role !== 'CUSTOMER') {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida.',
    });
  }

  if (!customer.twoFactorEnabled) {
    return res.json({
      success: true,
      enabled: false,
    });
  }

  const password = typeof req.body?.password === 'string'
    ? req.body.password
    : '';

  if (!customer.passwordHash || !password) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña actual es obligatoria.',
    });
  }

  const validPassword = await bcrypt.compare(
    password,
    customer.passwordHash,
  );

  if (!validPassword) {
    return res.status(401).json({
      success: false,
      error: 'Contraseña incorrecta.',
    });
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });

  return res.json({
    success: true,
    enabled: false,
  });
}

export async function verifyTwoFactorCodeAuth(
  req: Request,
  res: Response,
) {
  const customer = await getAuthenticatedCustomer(req);

  if (!customer || customer.role !== 'CUSTOMER') {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida.',
    });
  }

  const code = typeof req.body?.code === 'string'
    ? req.body.code.trim()
    : '';

  if (!customer.twoFactorEnabled || !customer.twoFactorSecret) {
    return res.status(400).json({
      success: false,
      error: 'La autenticación en dos pasos no está habilitada.',
    });
  }

  if (verifyTotpCode(customer.twoFactorSecret, code)) {
    return res.json({
      success: true,
      verified: true,
    });
  }

  let backupCodes: string[] = [];

  try {
    backupCodes = customer.backupCodes
      ? JSON.parse(customer.backupCodes)
      : [];
  } catch {
    backupCodes = [];
  }

  const normalizedCode = code.toUpperCase();

  const index = backupCodes.indexOf(normalizedCode);

  if (index !== -1) {
    backupCodes.splice(index, 1);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        backupCodes: JSON.stringify(backupCodes),
      },
    });

    return res.json({
      success: true,
      verified: true,
      backupCodeUsed: true,
    });
  }

  return res.status(401).json({
    success: false,
    verified: false,
    error: 'Código de autenticación inválido.',
  });
}

export async function completeTwoFactorLoginAuth(
  req: Request,
  res: Response,
) {
  const challengeToken = typeof req.body?.challengeToken === 'string'
    ? req.body.challengeToken.trim()
    : '';

  const code = typeof req.body?.code === 'string'
    ? req.body.code.trim()
    : '';

  if (!challengeToken || !code) {
    return res.status(400).json({
      success: false,
      error: 'Desafío y código de autenticación son obligatorios.',
    });
  }

  const challenge = await prisma.pendingTwoFactorAuth.findUnique({
    where: { id: hashToken(challengeToken) },
    include: { customer: true },
  });

  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) {
      await prisma.pendingTwoFactorAuth.delete({
        where: { id: challenge.id },
      }).catch(() => {});
    }

    return res.status(401).json({
      success: false,
      error: 'El desafío de autenticación ha expirado o no es válido.',
    });
  }

  const customer = challenge.customer;

  if (
    customer.role !== 'CUSTOMER' ||
    !customer.twoFactorEnabled ||
    !customer.twoFactorSecret
  ) {
    await prisma.pendingTwoFactorAuth.delete({
      where: { id: challenge.id },
    }).catch(() => {});

    return res.status(401).json({
      success: false,
      error: 'No se puede completar la autenticación.',
    });
  }

  let verified = verifyTotpCode(customer.twoFactorSecret, code);

  if (!verified) {
    let backupCodes: string[] = [];

    try {
      backupCodes = customer.backupCodes
        ? JSON.parse(customer.backupCodes)
        : [];
    } catch {
      backupCodes = [];
    }

    const normalizedCode = code.toUpperCase();
    const index = backupCodes.indexOf(normalizedCode);

    if (index !== -1) {
      backupCodes.splice(index, 1);

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          backupCodes: JSON.stringify(backupCodes),
        },
      });

      verified = true;
    }
  }

  if (!verified) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      verified: false,
      error: 'Código de autenticación inválido.',
    });
  }

  await prisma.pendingTwoFactorAuth.delete({
    where: { id: challenge.id },
  }).catch(() => {});

  await createSession(req, res, customer.id);

  return res.json({
    success: true,
    authenticated: true,
    verified: true,
    user: publicCustomer(customer),
  });
}

