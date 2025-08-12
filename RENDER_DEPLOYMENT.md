# Render Deployment Instructions

## Quick Deploy to Render

### Option 1: One-Click Deploy
1. Click this button to deploy directly: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/whatsapp-messaging-platform)

### Option 2: Manual Deploy

#### Step 1: Prepare Repository
```bash
# Clone and push to your GitHub
git clone <your-repo>
cd whatsapp-messaging-platform
git remote set-url origin https://github.com/yourusername/whatsapp-messaging-platform.git
git push -u origin main
```

#### Step 2: Create Render Services
1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repository**
4. **Render will automatically read `render.yaml` and create:**
   - Web Service (your application)
   - PostgreSQL Database

#### Step 3: Configure Environment Variables
Set these in Render Dashboard → Your Web Service → Environment:

```bash
# Required for production
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

#### Step 4: Custom Domain Setup
1. **In Render Dashboard:**
   - Go to your service → Settings → Custom Domains
   - Add: `yourdomain.com`
   - Note the CNAME target

2. **In your domain provider:**
   ```
   Type: CNAME
   Name: @ (or www)
   Value: your-app-name.onrender.com
   TTL: 300
   ```

#### Step 5: Update Webhooks
Once deployed, update webhook URLs in:

**Twilio Console:**
- Voice URL: `https://yourdomain.com/api/calls/webhook/answer`
- Status Callback: `https://yourdomain.com/api/calls/webhook/status`

**Meta Business Manager:**
- Webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
- Verify Token: `your_verify_token`

## Verification Steps

### 1. Health Check
```bash
curl https://yourdomain.com/api/health
```
Should return:
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

### 2. Webhook Verification
```bash
# WhatsApp webhook
curl "https://yourdomain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test123"
```
Should return: `test123`

### 3. Database Connection
Check Render logs for:
```
✅ Database connection successful
🗃️ Initializing database connection...
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
**Error:** `Module not found`
**Solution:** Check all imports in your code, ensure relative paths are correct

#### 2. Database Connection Failed
**Error:** `Database connection failed`
**Solution:** 
- Verify `DATABASE_URL` in environment variables
- Check database service is running
- Ensure database allows external connections

#### 3. Webhook Verification Failed
**Error:** `hub.challenge mismatch`
**Solution:**
- Verify `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches exactly
- Check webhook URL is accessible publicly
- Ensure no trailing slashes in URLs

#### 4. Environment Variables Not Loading
**Error:** `Missing required environment variables`
**Solution:**
- Double-check variable names (case-sensitive)
- Restart service after adding variables
- No spaces around = in variable values

### Monitoring

#### 1. Application Logs
- Render Dashboard → Your Service → Logs
- Look for startup success messages
- Monitor API request logs

#### 2. Performance Metrics
- Check response times in logs
- Monitor memory usage
- Set up alerts for errors

#### 3. Health Monitoring
Set up external monitoring:
```bash
# Add to cron or monitoring service
curl -f https://yourdomain.com/api/health || alert_webhook
```

## Scaling & Performance

### 1. Upgrade Instance
- Free tier: 512MB RAM, 0.1 CPU
- Starter: $7/month, 512MB RAM, 0.5 CPU
- Standard: $25/month, 2GB RAM, 1 CPU

### 2. Database Scaling
- Free tier: 1GB storage, 97 hours/month
- Starter: $7/month, 1GB storage, always on
- Standard: $15/month, 10GB storage

### 3. Optimize for Production
- Enable Redis for session storage
- Use CDN for static assets
- Implement rate limiting
- Add request caching

## Security Checklist

- [ ] All API keys stored as environment variables
- [ ] HTTPS enabled (automatic with custom domain)
- [ ] Webhook verify tokens configured
- [ ] Database connections encrypted
- [ ] Session secrets are strong and unique
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive data

## Backup & Recovery

### 1. Database Backups
- Render automatically backs up PostgreSQL daily
- Download backups from dashboard if needed
- Test restore procedures periodically

### 2. Application Backup
- Code is backed up in Git repository
- Environment variables documented
- Configuration files stored securely

### 3. Disaster Recovery
1. Deploy new instance from Git
2. Restore database from backup
3. Configure environment variables
4. Update DNS if needed
5. Test all functionality

## Support

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Review application logs in dashboard
3. Test health endpoints
4. Verify environment configuration
5. Contact Render support if platform issues