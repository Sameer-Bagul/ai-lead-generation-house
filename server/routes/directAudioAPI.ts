import { Express } from 'express';
import { storage } from '../storage';

export function setupDirectAudioAPI(app: Express) {
  
  // API endpoint to initiate direct audio call
  app.post('/api/calls/direct', async (req, res) => {
    try {
      const { contactId, campaignId } = req.body;
      
      if (!contactId || !campaignId) {
        return res.status(400).json({ 
          error: 'Missing contactId or campaignId' 
        });
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      console.log(`⚡ [DIRECT-AUDIO-API] Initiating direct audio call to ${contact.phone}`);
      
      // Import TwilioService and use direct audio method
      const { TwilioService } = await import('../services/twilio');
      const twilioService = new TwilioService();
      
      // Create call record first
      const call = await storage.createCall({
        contactId,
        campaignId,
        phoneNumber: contact.phone,
        status: 'initiated'
      });
      
      // Initiate call with direct audio webhook
      const callSid = await twilioService.initiateDirectAudioCall(contact.phone, call.id);
      
      // Update call with Twilio SID
      await storage.updateCall(call.id, { 
        twilioCallSid: callSid,
        status: 'active'
      });
      
      console.log(`✅ [DIRECT-AUDIO-API] Call initiated: ${callSid}`);
      
      res.json({
        success: true,
        callId: call.id,
        callSid,
        phoneNumber: contact.phone,
        mode: 'direct_audio'
      });
      
    } catch (error) {
      console.error('❌ [DIRECT-AUDIO-API] Error:', error);
      res.status(500).json({ 
        error: 'Failed to initiate direct audio call',
        details: error.message 
      });
    }
  });
  
}