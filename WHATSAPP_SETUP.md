# WhatsApp Business API Setup Guide

## Webhook Configuration for Meta Business

### 1. Webhook URL
Add this webhook URL in your Meta Business API configuration:

```
https://YOUR_REPLIT_APP_URL.replit.app/api/whatsapp/webhook
```

Replace `YOUR_REPLIT_APP_URL` with your actual Replit app URL.

### 2. Verify Token
Use this verification token when setting up the webhook in Meta Business:

```
your_verify_token_here
```

(You can change this to any secure token you prefer)

### 3. Webhook Fields to Subscribe
Make sure to subscribe to these webhook fields in Meta Business:
- `messages` - For receiving incoming messages
- `message_deliveries` - For delivery status updates  
- `message_reads` - For read receipt status updates

### 4. Required Environment Variables
Set these environment variables in your Replit secrets:

```
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token_here
```

### 5. Meta Business API Setup Steps

1. **Create Meta App**
   - Go to https://developers.facebook.com/apps/
   - Create a new app and select "Business" type
   - Add "WhatsApp Business API" product

2. **Get Phone Number ID**
   - In WhatsApp Business API settings
   - Copy your Phone Number ID (starts with numbers like 123456789012345)

3. **Generate Access Token**
   - In WhatsApp Business API settings
   - Generate a permanent access token
   - Copy the token (starts with EAAx...)

4. **Configure Webhook**
   - In WhatsApp Business API settings
   - Add webhook URL: `https://your-app.replit.app/api/whatsapp/webhook`
   - Add verify token: `your_verify_token_here`
   - Subscribe to fields: messages, message_deliveries, message_reads

5. **Test Configuration**
   - Send a test message to verify webhook is working
   - Check Replit console logs for webhook events

### 6. Features Available After Setup

✅ **Real Message Sending**: Messages will be delivered to customers' WhatsApp
✅ **Incoming Messages**: Customer replies will appear in your chat interface  
✅ **Status Updates**: Real delivery receipts (sent, delivered, read)
✅ **Two-way Communication**: Full bidirectional messaging
✅ **Contact Auto-creation**: New contacts created from incoming messages

### 7. Testing the Setup

1. Send a message from the WhatsApp Messaging page
2. Check if customer receives it on their WhatsApp
3. Have customer reply to the message
4. Verify reply appears in your chat interface
5. Confirm status indicators update properly

### 8. Troubleshooting

**Webhook Verification Fails:**
- Check the verify token matches exactly
- Ensure webhook URL is publicly accessible
- Verify HTTPS is working

**Messages Not Sending:**
- Verify WHATSAPP_ACCESS_TOKEN is correct
- Check WHATSAPP_PHONE_NUMBER_ID is valid
- Ensure phone numbers are in international format (+1234567890)

**Not Receiving Replies:**
- Confirm webhook is subscribed to "messages" field
- Check webhook endpoint is receiving POST requests
- Verify customer phone number is correctly formatted

## Current Status
🟡 **Webhook Ready** - Endpoints configured, waiting for Meta Business API credentials