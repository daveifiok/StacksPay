import 'express-session';

declare module 'express-session' {
  interface SessionData {
    merchantId?: string;
    sessionId?: string;
    passport?: any;
  }
}