import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database';
import { env } from '../config/environment';

export class HealthController {
  
  // Basic health check
  async healthCheck(req: Request, res: Response) {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        port: env.PORT,
        database: await checkDatabaseConnection(),
        services: {
          twilio: !!env.TWILIO_ACCOUNT_SID,
          whatsapp: !!env.WHATSAPP_ACCESS_TOKEN,
          openai: !!env.OPENAI_API_KEY,
          elevenlabs: !!env.ELEVENLABS_API_KEY
        }
      };
      
      // Return 200 if all critical services are healthy
      const isHealthy = health.database && (env.NODE_ENV === 'development' || (
        health.services.twilio && 
        health.services.whatsapp && 
        health.services.openai
      ));
      
      res.status(isHealthy ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Detailed system info (for debugging)
  async systemInfo(req: Request, res: Response) {
    try {
      const info = {
        node_version: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        baseUrl: env.CUSTOM_DOMAIN || env.RENDER_EXTERNAL_URL || 'localhost',
      };
      
      res.json(info);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}