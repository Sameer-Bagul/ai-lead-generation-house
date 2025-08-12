# Production Deployment Guide

## Overview
This guide covers deploying the WhatsApp Messaging Platform to production on Render with custom domain support.

## Quick Start
1. **Prepare your repository**
2. **Deploy to Render using Blueprint**
3. **Configure environment variables**
4. **Set up custom domain**
5. **Update webhook URLs**

## Prerequisites
- GitHub account with repository
- Render account (free tier available)
- Custom domain (optional but recommended)
- All required API keys (Twilio, WhatsApp, OpenAI, ElevenLabs)

## Step 1: Repository Setup

### Clone and Prepare
```bash
# Clone your repository
git clone <your-repo-url>
cd whatsapp-messaging-platform

# Ensure all files are committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Required Files
Ensure these files exist in your repository:
- ✅ `render.yaml` - Render deployment configuration
- ✅ `Dockerfile` - Container configuration
- ✅ `.env.example` - Environment variables template
- ✅ `RENDER_DEPLOYMENT.md` - Detailed Render instructions

## Step 2: Deploy to Render

### Option A: Blueprint Deployment (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will read `render.yaml` and create:
   - Web Service (your application)
   - PostgreSQL Database (if using Render database)

### Option B: Manual Service Creation
1. Create Web Service:
   - **Name:** `whatsapp-messaging-platform`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

2. Create PostgreSQL Database:
   - **Name:** `whatsapp-messaging-db`
   - **Plan:** Free (or paid for production)

## Step 3: Environment Configuration

### Required Environment Variables
Set these in Render Dashboard → Your Service → Environment:

```bash
# Application
NODE_ENV=production
PORT=10000
CUSTOM_DOMAIN=https://yourdomain.com

# Database (auto-configured if using Render PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# AI Services
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Security
SESSION_SECRET=your_session_secret
```

### Variable Sources
- **Generate:** Use `openssl rand -hex 32` for `SESSION_SECRET`
- **Twilio:** Get from [Twilio Console](https://console.twilio.com)
- **WhatsApp:** Get from [Meta Business Manager](https://business.facebook.com)
- **OpenAI:** Get from [OpenAI Platform](https://platform.openai.com)
- **ElevenLabs:** Get from [ElevenLabs](https://elevenlabs.io)

## Step 4: Custom Domain Setup

### In Render Dashboard
1. Go to your service → **Settings** → **Custom Domains**
2. Add your domain: `yourdomain.com`
3. Note the CNAME target (e.g., `your-app.onrender.com`)

### In Your Domain Provider
Create CNAME record:
```
Type: CNAME
Name: @ (or www)
Value: your-app-name.onrender.com
TTL: 300 (5 minutes)
```

### SSL Certificate
- Render automatically provisions Let's Encrypt SSL
- Certificate updates automatically
- HTTPS is enforced by default

## Step 5: Webhook Configuration

### Update Twilio Webhooks
In [Twilio Console](https://console.twilio.com):
1. **Voice Configuration:**
   - Webhook URL: `https://yourdomain.com/api/calls/webhook/answer`
   - HTTP Method: POST
   - Status Callback URL: `https://yourdomain.com/api/calls/webhook/status`

2. **Phone Number Configuration:**
   - Configure your Twilio phone number to use the voice webhook

### Update WhatsApp Webhooks
In [Meta Business Manager](https://business.facebook.com):
1. **App Configuration:**
   - Webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
   - Verify Token: `your_verify_token` (same as environment variable)

2. **Webhook Subscriptions:**
   - Subscribe to: `messages`, `message_deliveries`, `message_reads`

## Step 6: Verification

### Health Check
```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "production",
  "database": true,
  "services": {
    "twilio": true,
    "whatsapp": true,
    "openai": true,
    "elevenlabs": true
  }
}
```

### WhatsApp Webhook
```bash
curl "https://yourdomain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test123"
```

Expected response: `test123`

### Database Connection
Check Render logs for:
```
✅ Database ready
🚀 Server running on port 10000
🌐 Base URL: https://yourdomain.com
🏥 Health check: https://yourdomain.com/api/health
🔐 Production mode - All services should be configured
```

## Step 7: Test Core Features

### 1. Dashboard Access
- Visit: `https://yourdomain.com`
- Verify dashboard loads with campaign data
- Check that all tabs work (Active Campaigns, Past Campaigns, etc.)

### 2. Contact Management
- Upload CSV file with contacts
- Verify contacts appear in dashboard
- Test filtering and search functionality

### 3. WhatsApp Templates
- Verify templates load from Meta API
- Test template selection in campaign creation

### 4. Campaign Creation
- Create a test campaign
- Send to a small subset of contacts
- Monitor delivery status

## Monitoring & Maintenance

### Application Logs
Monitor in Render Dashboard → Your Service → Logs:
- API request logs
- Error messages
- Performance metrics

### Database Monitoring
- Connection status
- Query performance
- Storage usage

### Health Monitoring
Set up external monitoring:
```bash
# Example: UptimeRobot, Pingdom, or custom monitoring
curl -f https://yourdomain.com/api/health || send_alert
```

## Scaling Considerations

### Render Plans
- **Free:** 750 hours/month, 512MB RAM
- **Starter:** $7/month, 512MB RAM, always on
- **Standard:** $25/month, 2GB RAM, 1 CPU

### Database Scaling
- **Free:** 1GB storage, 97 hours/month
- **Starter:** $7/month, 1GB storage, always on
- **Standard:** $15/month, 10GB storage

### Performance Optimization
- Enable HTTP/2 (automatic with Render)
- Use Redis for session storage (upgrade consideration)
- Implement CDN for static assets
- Add request caching for high-traffic endpoints

## Security Best Practices

### Environment Variables
- ✅ All secrets stored as environment variables
- ✅ No hardcoded credentials in code
- ✅ Strong session secrets generated

### Network Security
- ✅ HTTPS enforced (Render automatic)
- ✅ Webhook verify tokens configured
- ✅ Database connections encrypted

### Application Security
- ✅ CORS configured properly
- ✅ Request validation with Zod schemas
- ✅ Error messages don't expose sensitive data

## Backup & Recovery

### Database Backups
- Render PostgreSQL includes automatic daily backups
- Manual backups available in dashboard
- Point-in-time recovery for paid plans

### Application Recovery
1. Code backed up in Git repository
2. Environment variables documented
3. Deploy new instance from Git
4. Restore database from backup
5. Update DNS if needed

## Troubleshooting

### Common Issues

#### 1. Build Failures
**Error:** `Module not found` or `Build failed`
**Solution:**
- Check package.json dependencies
- Verify all imports use correct paths
- Ensure TypeScript compilation succeeds

#### 2. Environment Variable Issues
**Error:** `Missing required environment variables`
**Solution:**
- Double-check variable names (case-sensitive)
- Restart service after adding variables
- Verify no extra spaces in values

#### 3. Database Connection Failed
**Error:** `Database connection failed`
**Solution:**
- Verify DATABASE_URL format
- Check database service status
- Ensure network connectivity

#### 4. Webhook Verification Failed
**Error:** `Webhook verification failed`
**Solution:**
- Verify WHATSAPP_WEBHOOK_VERIFY_TOKEN matches
- Check webhook URL accessibility
- Ensure no trailing slashes

### Debug Steps
1. Check health endpoint: `/api/health`
2. Review application logs in Render dashboard
3. Verify environment variables are set
4. Test webhook endpoints manually
5. Check database connectivity

## Support Resources

- **Render Documentation:** https://render.com/docs
- **Twilio Documentation:** https://www.twilio.com/docs
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp
- **Application Logs:** Render Dashboard → Your Service → Logs

## Next Steps

After successful deployment:
1. **Monitor performance** and optimize as needed
2. **Set up monitoring alerts** for downtime/errors
3. **Plan for scaling** based on usage patterns
4. **Regular security updates** for dependencies
5. **Backup verification** and recovery testing

## Production Checklist

- [ ] Repository deployed to Render
- [ ] All environment variables configured
- [ ] Custom domain configured and SSL working
- [ ] Health endpoint returns 200 status
- [ ] Database connection successful
- [ ] Twilio webhooks updated and verified
- [ ] WhatsApp webhooks configured and verified
- [ ] Dashboard accessible and functional
- [ ] Contact upload and management working
- [ ] Campaign creation and sending tested
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery plan in place