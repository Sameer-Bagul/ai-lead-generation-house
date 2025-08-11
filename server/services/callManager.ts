import { OpenAIService } from './openaiService';
import { ElevenLabsService } from './elevenlabsService';
import { twilioService } from './twilioService';
import { directSpeechService } from './directSpeechService';
// Removed OpenAI speech service import - using Twilio direct speech recognition
import { storage } from '../storage';
// Using built-in fetch available in Node.js 18+

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ActiveCall {
  id: string;
  contactId: string;
  campaignId: string;
  phoneNumber: string;
  twilioCallSid: string;
  conversationHistory: ConversationTurn[];
  status: 'active' | 'completed' | 'failed';
  startTime: Date;
}

export class CallManager {
  private activeCalls: Map<string, ActiveCall> = new Map();

  // Start a new call
  async startCall(
    contactId: string,
    campaignId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      // Get campaign details
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Create call record in database
      const newCall = await storage.createCall({
        contactId,
        campaignId,
        phoneNumber,
        status: 'active',
        startTime: new Date()
      });

      // Initiate Twilio call
      const twilioResult = await twilioService.initiateCall(
        phoneNumber,
        campaignId,
        newCall.id
      );

      if (!twilioResult.success) {
        // Update call status to failed
        await storage.updateCall(newCall.id, { status: 'failed' });
        return { success: false, error: twilioResult.error };
      }

      // Update call with Twilio SID
      await storage.updateCall(newCall.id, { 
        twilioCallSid: twilioResult.twilioCallSid 
      });

      // Track active call
      this.activeCalls.set(newCall.id, {
        id: newCall.id,
        contactId,
        campaignId,
        phoneNumber,
        twilioCallSid: twilioResult.twilioCallSid!,
        conversationHistory: [],
        status: 'active',
        startTime: new Date()
      });

      return { success: true, callId: newCall.id };
    } catch (error) {
      console.error('Error starting call:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Ensure a call is tracked in active calls (used after server restarts)
  ensureCallIsTracked(callId: string, dbCall: any): void {
    if (!this.activeCalls.has(callId)) {
      console.log(`🔄 Adding call ${callId} to active calls tracking`);
      this.activeCalls.set(callId, {
        id: dbCall.id,
        contactId: dbCall.contactId,
        campaignId: dbCall.campaignId,
        phoneNumber: dbCall.phoneNumber,
        twilioCallSid: dbCall.twilioCallSid,
        conversationHistory: [],
        status: 'active',
        startTime: dbCall.startTime
      });
    }
  }

  // Process speech input during call
  async processSpeechInput(
    callId: string,
    speechText: string
  ): Promise<{ twiml: string; success: boolean }> {
    try {
      console.log(`🔍 Looking for active call: ${callId}`);
      console.log(`📊 Active calls count: ${this.activeCalls.size}`);
      console.log(`📋 Active call IDs: ${Array.from(this.activeCalls.keys()).join(', ')}`);

      let activeCall = this.activeCalls.get(callId);

      // If call not in memory, try to reconstruct from database
      if (!activeCall) {
        console.log(`⚠️ Call ${callId} not found in active calls, reconstructing from database`);
        const dbCall = await storage.getCall(callId);
        if (dbCall && dbCall.status === 'active') {
          activeCall = {
            id: dbCall.id,
            contactId: dbCall.contactId!,
            campaignId: dbCall.campaignId!,
            phoneNumber: dbCall.phoneNumber,
            twilioCallSid: dbCall.twilioCallSid!,
            conversationHistory: [],
            status: 'active',
            startTime: dbCall.startTime
          };
          this.activeCalls.set(callId, activeCall);
          console.log(`✅ Reconstructed active call from database`);
        } else {
          console.log(`❌ Call ${callId} not found in database or not active`);
          return {
            twiml: twilioService.generateTwiML('hangup', { 
              text: 'Thank you for your time. Goodbye.',
              language: 'en',
              voice: 'alice'
            }),
            success: false
          };
        }
      }

      // Get campaign for script context
      const campaign = await storage.getCampaign(activeCall.campaignId);
      if (!campaign) {
        return {
          twiml: twilioService.generateTwiML('hangup', { 
            text: 'Thank you for your time. Goodbye.',
            language: 'en',
            voice: 'alice'
          }),
          success: false
        };
      }

      // Add user message to conversation history
      activeCall.conversationHistory.push({
        role: 'user',
        content: speechText,
        timestamp: new Date()
      });

      // Extract contact information from speech (optimized for speed)
      const contactInfo = directSpeechService.extractContactInfo(speechText);

      // Get current call data to check existing contact info
      const currentCall = await storage.getCall(callId);
      const hasContactInfo = {
        whatsapp: currentCall?.extractedWhatsapp || contactInfo.whatsapp,
        email: currentCall?.extractedEmail || contactInfo.email
      };

      // Update call with any new contact info
      if (contactInfo.whatsapp || contactInfo.email) {
        await storage.updateCall(callId, {
          extractedWhatsapp: hasContactInfo.whatsapp,
          extractedEmail: hasContactInfo.email
        });
        console.log(`✅ Updated contact info - WhatsApp: ${hasContactInfo.whatsapp}, Email: ${hasContactInfo.email}`);
      }

      // Generate AI response quickly using campaign settings
      const aiResult = await OpenAIService.generateResponse(
        speechText,
        campaign.script || campaign.aiPrompt,
        activeCall.conversationHistory.slice(-4).map(turn => ({ // Only last 4 exchanges for speed
          role: turn.role,
          content: turn.content
        })),
        hasContactInfo,
        campaign.openaiModel
      );

      const aiResponse = aiResult.response;

      // Add AI response to conversation history
      activeCall.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      // Save conversation to database
      try {
        await storage.createCallMessage({
          callId,
          role: 'user',
          content: speechText
        });
        await storage.createCallMessage({
          callId,
          role: 'assistant', 
          content: aiResponse
        });
        console.log('✅ Messages saved to database successfully');
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
      }

      // Check if conversation should end (only after collecting BOTH WhatsApp and email)
      const hasAllContactInfo = hasContactInfo.whatsapp && hasContactInfo.email;
      const shouldEndCall = (hasAllContactInfo && (
                           activeCall.conversationHistory.length >= 8 || 
                           aiResponse.toLowerCase().includes('thank you for your time') ||
                           aiResponse.toLowerCase().includes('goodbye')
                           )) ||
                           speechText.toLowerCase().includes('not interested') ||
                           speechText.toLowerCase().includes('hang up');

      // Generate ElevenLabs audio with fast fallback to Twilio if it fails
      let twiml;

      try {
        console.log(`🎤 Generating ElevenLabs audio with campaign voice: ${campaign.voiceId}`);
        const voiceConfig = campaign.voiceConfig as any;
        const audioBuffer = await ElevenLabsService.textToSpeech(
          aiResponse,
          campaign.voiceId,
          {
            stability: voiceConfig?.stability || 0.5,
            similarityBoost: voiceConfig?.similarityBoost || 0.75,
            style: voiceConfig?.style || 0.0,
            speakerBoost: voiceConfig?.useSpeakerBoost || true,
            model: campaign.elevenlabsModel || 'eleven_turbo_v2'
          }
        );

        // Save audio file temporarily
        const fs = await import('fs');
        const path = await import('path');
        const audioFileName = `response_${callId}_${Date.now()}.mp3`;
        const tempDir = path.default.join(process.cwd(), 'temp');
        if (!fs.default.existsSync(tempDir)) {
          fs.default.mkdirSync(tempDir, { recursive: true });
        }
        const audioFilePath = path.default.join(tempDir, audioFileName);
        fs.default.writeFileSync(audioFilePath, audioBuffer);

        // Create accessible URL
        const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
          `https://${process.env.REPLIT_DEV_DOMAIN}` : 
          `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        const audioUrl = `${baseUrl}/audio/${audioFileName}`;

        console.log(`✅ Using ElevenLabs voice: ${campaign.voiceId}, audio URL: ${audioUrl}`);

        if (shouldEndCall) {
          twiml = twilioService.generateTwiML('hangup', {
            audioUrl: audioUrl, // Use ElevenLabs audio
            language: campaign.language || 'en',
            addTypingSound: true,
            addThinkingPause: true
          });
          setTimeout(() => this.completeCall(callId), 1000);
        } else {
          twiml = twilioService.generateTwiML('gather', {
            audioUrl: audioUrl,
            action: `/api/calls/${callId}/process-speech`,
            recordingCallback: `/api/calls/recording-complete?callId=${callId}`,
            language: campaign.language || 'en',
            addTypingSound: true,
            addThinkingPause: true
          });
        }

      } catch (elevenlabsError) {
        console.error('❌ ElevenLabs TTS failed - maintaining voice consistency, no fallback:', elevenlabsError);

        // No fallback to maintain voice consistency - end call gracefully
        twiml = twilioService.generateTwiML('hangup', {
          text: 'I apologize, there was a technical issue. We will call you back shortly.',
          language: campaign.language || 'en',
          addTypingSound: true
        });
        setTimeout(() => this.completeCall(callId), 1000);
      }

      // Broadcast real-time update
      this.broadcastCallUpdate(activeCall);

      return { twiml, success: true };
    } catch (error) {
      console.error('❌ Error processing speech input:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      return {
        twiml: twilioService.generateTwiML('hangup', { 
          text: 'I apologize, there was a technical issue. Thank you for your time.',
          language: 'en', // Default language for error cases
          voice: 'alice'
        }),
        success: false
      };
    }
  }

  // Removed processRecording method - using direct speech recognition only

  // Handle call completion
  async completeCall(callId: string, duration?: number): Promise<void> {
    try {
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) return;

      // Update call status in database
      await storage.updateCall(callId, {
        status: 'completed',
        endTime: new Date(),
        duration: duration || Math.floor((Date.now() - activeCall.startTime.getTime()) / 1000)
      });

      // Remove from active calls
      this.activeCalls.delete(callId);

      // Generate call summary using AI
      const summary = await this.generateCallSummary(activeCall.conversationHistory);
      if (summary) {
        await storage.updateCall(callId, { conversationSummary: summary });
      }

      // Extract contact information and send follow-up if needed
      await this.processPostCallActions(callId, activeCall.conversationHistory);

      console.log(`Call ${callId} completed successfully`);
    } catch (error) {
      console.error('Error completing call:', error);
    }
  }

  // Generate call summary using AI
  private async generateCallSummary(conversationHistory: ConversationTurn[]): Promise<string> {
    try {
      const conversationText = conversationHistory
        .map(turn => `${turn.role}: ${turn.content}`)
        .join('\n');

      const summaryResponse = await OpenAIService.generateResponse(
        `Please provide a brief summary of this call conversation:\n${conversationText}`,
        "Generate a concise call summary focusing on key points discussed and outcomes.",
        []
      );

      return summaryResponse.response;
    } catch (error) {
      console.error('Error generating call summary:', error);
      return 'Call completed - summary generation failed';
    }
  }

  // Process post-call actions (WhatsApp follow-up, contact updates)
  private async processPostCallActions(callId: string, conversationHistory: ConversationTurn[]): Promise<void> {
    try {
      // Extract WhatsApp/email from conversation if mentioned
      const conversationText = conversationHistory
        .map(turn => turn.content)
        .join(' ');

      // Simple regex to extract WhatsApp numbers and emails
      const whatsappMatch = conversationText.match(/(\+?[\d\s\-\(\)]{10,})/);
      const emailMatch = conversationText.match(/[\w\.-]+@[\w\.-]+\.\w+/);

      if (whatsappMatch || emailMatch) {
        const extractedWhatsapp = whatsappMatch ? whatsappMatch[1].replace(/\D/g, '') : undefined;
        const extractedEmail = emailMatch ? emailMatch[0] : undefined;

        // Update call record with extracted data
        await storage.updateCall(callId, {
          extractedWhatsapp,
          extractedEmail
        });

        // Send follow-up WhatsApp message if number was extracted
        if (extractedWhatsapp) {
          const message = "Thank you for your time during our call. We'll follow up with the information discussed about LabsCheck partnerships.";
          const result = await twilioService.sendWhatsAppMessage(extractedWhatsapp, message);

          if (result.success) {
            await storage.updateCall(callId, { whatsappSent: true });
          }
        }
      }
    } catch (error) {
      console.error('Error processing post-call actions:', error);
    }
  }

  // Get active calls
  getActiveCalls(): ActiveCall[] {
    return Array.from(this.activeCalls.values());
  }

  // Get call by ID
  getCall(callId: string): ActiveCall | undefined {
    return this.activeCalls.get(callId);
  }

  // Broadcast call updates via WebSocket
  private broadcastCallUpdate(call: ActiveCall): void {
    try {
      const broadcastFn = (global as any).broadcastToClients;
      if (broadcastFn) {
        broadcastFn({
          type: 'call_update',
          call: {
            id: call.id,
            status: call.status,
            conversationHistory: call.conversationHistory,
            duration: Math.floor((Date.now() - call.startTime.getTime()) / 1000)
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting call update:', error);
    }
  }
}

// Export singleton instance
export const callManager = new CallManager();