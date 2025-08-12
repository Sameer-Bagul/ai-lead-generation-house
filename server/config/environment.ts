// Environment configuration and validation
export interface EnvironmentConfig {
  // Server
  NODE_ENV: string;
  PORT: number;
  
  // Domain
  CUSTOM_DOMAIN?: string;
  RENDER_EXTERNAL_URL?: string;
  
  // Database
  DATABASE_URL: string;
  
  // Twilio
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  
  // WhatsApp
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: string;
  
  // AI Services
  OPENAI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  
  // Optional
  SENDGRID_API_KEY?: string;
  SESSION_SECRET: string;
}

// Validate and load environment variables
function validateEnvironment(): EnvironmentConfig {
  // Only validate DATABASE_URL as critical for development
  const criticalRequired = ['DATABASE_URL'];
  const missing = criticalRequired.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
  }

  // For production, we can add more validation
  if (process.env.NODE_ENV === 'production') {
    const prodRequired = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN', 
      'TWILIO_PHONE_NUMBER',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      'SESSION_SECRET'
    ];
    
    const missingProd = prodRequired.filter(key => !process.env[key]);
    if (missingProd.length > 0) {
      console.warn(`⚠️ Missing production environment variables: ${missingProd.join(', ')}`);
    }
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000'),
    CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
    DATABASE_URL: process.env.DATABASE_URL!,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN!,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY!,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET!
  };
}

// Get base URL for webhooks
export function getBaseUrl(): string {
  const config = env;
  
  // Priority: Custom domain > Render URL > Replit domains > localhost
  if (config.CUSTOM_DOMAIN) {
    return config.CUSTOM_DOMAIN;
  }
  
  if (config.RENDER_EXTERNAL_URL) {
    return config.RENDER_EXTERNAL_URL;
  }
  
  // Fallback for Replit (during development)
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  
  // Development fallback
  return `http://localhost:${config.PORT}`;
}

// Export validated environment
export const env = validateEnvironment();

// Log configuration on startup
export function logEnvironmentInfo() {
  console.log('🔧 Environment Configuration:');
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   PORT: ${env.PORT}`);
  console.log(`   BASE_URL: ${getBaseUrl()}`);
  console.log(`   DATABASE: ${env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   TWILIO: ${env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   WHATSAPP: ${env.WHATSAPP_ACCESS_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   OPENAI: ${env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   ELEVENLABS: ${env.ELEVENLABS_API_KEY ? '✅ Configured' : '❌ Missing'}`);
}