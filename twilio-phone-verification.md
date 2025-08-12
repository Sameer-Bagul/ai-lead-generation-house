# Twilio Phone Verification Guide

## Issue: AI Calling Not Working
The error shows: "The number +19325025730 is unverified. Trial accounts may only make calls to verified numbers."

## Solution: Verify Phone Numbers in Twilio Console

### Steps to Verify a Phone Number:

1. **Go to Twilio Console**
   - Visit: https://console.twilio.com
   - Log in with your Twilio account

2. **Navigate to Verified Caller IDs**
   - Go to Phone Numbers → Verified Caller IDs
   - Click "Add a new Caller ID"

3. **Add Phone Number**
   - Enter the phone number you want to call (e.g., +919325025730)
   - Choose verification method (SMS or Voice Call)
   - Complete the verification process

4. **Test the Call**
   - Once verified, the AI calling should work
   - Try initiating a call from the dashboard

### Current Status:
- ✅ AI calling code is working correctly
- ✅ Phone number formatting improved
- ✅ Better error messages added
- ❌ Target phone numbers need verification in Twilio Console

### For Production:
- Upgrade from Twilio trial account to remove verification requirement
- Production accounts can call any valid phone number
- Trial accounts are limited to verified numbers only

## WhatsApp Status:
- Webhook endpoint is working correctly
- Test messages process successfully
- Real phone messages require Meta Business Manager configuration check