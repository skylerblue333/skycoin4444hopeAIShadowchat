import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

export const securityHardening = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }),

  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  apiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    skip: (req) => req.user?.role === 'admin',
  }),

  sanitize: mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
          },
  }),

  hpp: hpp({
    whitelist: ['sort', 'fields', 'filter', 'page', 'limit'],
  }),

  corsOptions: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  secureHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },

  inputValidation: {
    maxJsonSize: '10kb',
    maxUrlEncodedSize: '10kb',
    maxFieldSize: '1mb',
  },

  sessionSecurity: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    },
  },

  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90,
  },

  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 100000,
    saltLength: 32,
  },

  logging: {
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: 'combined',
    excludePaths: ['/health', '/metrics'],
  },

  monitoring: {
    enableAnomalyDetection: true,
    enableRealTimeAlerts: true,
    alertThresholds: {
      failedLogins: 5,
      suspiciousActivity: 10,
      apiErrors: 50,
    },
  },
};

export const applySecurityHardening = (app: any) => {
  app.use(securityHardening.helmet);
  app.use(securityHardening.rateLimiter);
  app.use(securityHardening.sanitize);
  app.use(securityHardening.hpp);

  Object.entries(securityHardening.secureHeaders).forEach(([key, value]) => {
    app.use((req: any, res: any, next: any) => {
      res.setHeader(key, value);
      next();
    });
  });

  return app;
};
