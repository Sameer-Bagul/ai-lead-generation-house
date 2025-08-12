# WhatsApp Webhook Setup Guide

## Your Webhook Configuration

**Webhook URL**: `https://04b918f8-1324-429a-8c64-ebdefef53c64-00-2atotxxaug2tv.worf.replit.dev/webhook/whatsapp`
**Verify Token**: `whatsapp_labs_verify_2025`

## Steps to Configure in Meta Business Manager:

1. Go to your Meta Business Manager
2. Navigate to WhatsApp Business Account Settings
3. Go to Configuration → Webhooks
4. Click "Configure Webhooks"
5. Enter the webhook URL and verify token above
6. Subscribe to the "messages" field
7. Click "Verify and Save"

## Testing the Webhook:

You can test the webhook verification by visiting:
`https://04b918f8-1324-429a-8c64-ebdefef53c64-00-2atotxxaug2tv.worf.replit.dev/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=whatsapp_labs_verify_2025&hub.challenge=test123`

## If Still Getting Errors:

1. Make sure your Replit app is running
2. Check that the domain is accessible publicly
3. Verify the exact webhook URL format
4. Ensure the verify token matches exactly (case-sensitive)
5. Check the webhook logs in your server console

The webhook is now configured with enhanced logging to help diagnose any issues.