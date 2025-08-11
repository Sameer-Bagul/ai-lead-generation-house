import { storage } from '../storage';
import { ContactEngagement, InsertContactEngagement, CampaignMetrics, Contact } from '@shared/schema';
import { WhatsAppTemplateService } from './whatsappTemplateService';
import { MessagingService } from './messagingService';

export interface MultiChannelCampaignRequest {
  contactIds: number[];
  channel: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'BOTH';
  campaignId?: string;
  whatsappTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
  followUpDays: number;
}

export interface CampaignAnalytics {
  totalContacts: number;
  contacted: number;
  responded: number;
  onboarded: number;
  pending: number;
  failed: number;
  followUpsDue: number;
  todayActivity: {
    reached: number;
    responded: number;
    onboarded: number;
  };
}

export class CampaignService {
  // Start a multi-channel campaign
  static async startMultiChannelCampaign(request: MultiChannelCampaignRequest): Promise<ContactEngagement[]> {
    const engagements: ContactEngagement[] = [];
    
    for (const contactId of request.contactIds) {
      try {
        const contact = await storage.getContact(contactId);
        if (!contact) {
          console.error(`Contact ${contactId} not found`);
          continue;
        }

        const engagement = await this.createContactEngagement({
          contactId,
          channel: request.channel,
          campaignId: request.campaignId || `campaign_${Date.now()}`,
          status: 'PENDING',
          nextAction: request.channel === 'BOTH' ? 'CALL' : request.channel,
          followUpDate: new Date(Date.now() + request.followUpDays * 24 * 60 * 60 * 1000),
          attempts: 0
        });

        // Execute first contact attempt
        await this.executeContactAttempt(engagement, contact, request);
        
        engagements.push(engagement);
      } catch (error) {
        console.error(`Error processing contact ${contactId}:`, error);
      }
    }

    return engagements;
  }

  // Create contact engagement record
  static async createContactEngagement(data: InsertContactEngagement): Promise<ContactEngagement> {
    return await storage.createContactEngagement(data);
  }

  // Execute contact attempt (call, WhatsApp, or email)
  static async executeContactAttempt(
    engagement: ContactEngagement, 
    contact: Contact, 
    campaignConfig: MultiChannelCampaignRequest
  ): Promise<void> {
    try {
      let success = false;
      let errorMessage = '';

      switch (engagement.nextAction) {
        case 'CALL':
          // Start AI call
          success = await this.initiateAICall(contact, engagement);
          if (success && campaignConfig.channel === 'BOTH') {
            // Schedule WhatsApp follow-up after call
            await this.scheduleWhatsAppFollowUp(engagement, contact, campaignConfig);
          }
          break;

        case 'WHATSAPP':
          // Send WhatsApp template message
          if (campaignConfig.whatsappTemplate) {
            const result = await WhatsAppTemplateService.sendTemplateMessage(
              contact.phone,
              campaignConfig.whatsappTemplate,
              'en_US'
            );
            success = result.success;
            errorMessage = result.error || '';
            
            if (success) {
              await storage.updateContactEngagement(engagement.id, {
                whatsappMessageId: result.messageId,
                status: 'REACHED',
                lastContactedAt: new Date(),
                attempts: engagement.attempts + 1
              });
            }
          }
          break;

        case 'EMAIL':
          // Send email
          if (campaignConfig.emailSubject && campaignConfig.emailBody) {
            success = await MessagingService.sendEmail(
              contact.email || '',
              campaignConfig.emailSubject,
              campaignConfig.emailBody
            );
            
            if (success) {
              await storage.updateContactEngagement(engagement.id, {
                status: 'REACHED',
                lastContactedAt: new Date(),
                attempts: engagement.attempts + 1
              });
            }
          }
          break;
      }

      if (!success) {
        await storage.updateContactEngagement(engagement.id, {
          status: 'FAILED',
          response: errorMessage,
          attempts: engagement.attempts + 1
        });
      }

      // Update campaign metrics
      await this.updateCampaignMetrics(engagement.campaignId || '', success);
      
    } catch (error) {
      console.error('Error executing contact attempt:', error);
      await storage.updateContactEngagement(engagement.id, {
        status: 'FAILED',
        response: error instanceof Error ? error.message : 'Unknown error',
        attempts: engagement.attempts + 1
      });
    }
  }

  // Initiate AI call through existing call management system
  static async initiateAICall(contact: Contact, engagement: ContactEngagement): Promise<boolean> {
    try {
      // This would integrate with your existing call management system
      // For now, we'll simulate a call initiation
      console.log(`Initiating AI call to ${contact.phone} for engagement ${engagement.id}`);
      
      // Update engagement with call status
      await storage.updateContactEngagement(engagement.id, {
        status: 'REACHED',
        lastContactedAt: new Date(),
        attempts: engagement.attempts + 1,
        nextAction: 'WHATSAPP' // Set next action for follow-up
      });
      
      return true;
    } catch (error) {
      console.error('Error initiating AI call:', error);
      return false;
    }
  }

  // Schedule WhatsApp follow-up after call
  static async scheduleWhatsAppFollowUp(
    engagement: ContactEngagement, 
    contact: Contact, 
    campaignConfig: MultiChannelCampaignRequest
  ): Promise<void> {
    // Schedule WhatsApp message 1 hour after call
    const followUpTime = new Date(Date.now() + 60 * 60 * 1000);
    
    await storage.updateContactEngagement(engagement.id, {
      nextAction: 'WHATSAPP',
      followUpDate: followUpTime
    });
  }

  // Process due follow-ups
  static async processDueFollowUps(): Promise<void> {
    try {
      const dueEngagements = await storage.getDueFollowUps();
      
      for (const engagement of dueEngagements) {
        const contact = await storage.getContact(engagement.contactId);
        if (contact) {
          // Create campaign config for follow-up
          const followUpConfig: MultiChannelCampaignRequest = {
            contactIds: [contact.id],
            channel: engagement.nextAction as any,
            followUpDays: 7, // Default 7-day follow-up cycle
            whatsappTemplate: 'follow_up_template' // Use a default follow-up template
          };
          
          await this.executeContactAttempt(engagement, contact, followUpConfig);
        }
      }
    } catch (error) {
      console.error('Error processing due follow-ups:', error);
    }
  }

  // Update campaign metrics
  static async updateCampaignMetrics(campaignId: string, success: boolean): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create today's metrics
      let metrics = await storage.getCampaignMetrics(campaignId, today);
      
      if (!metrics) {
        metrics = await storage.createCampaignMetrics({
          campaignId,
          date: today,
          contactsReached: 0,
          responsesReceived: 0,
          onboardingStarted: 0,
          onboardingCompleted: 0,
          followUpsScheduled: 0,
          callsAttempted: 0,
          callsConnected: 0,
          whatsappSent: 0,
          whatsappDelivered: 0,
          emailsSent: 0,
          emailsOpened: 0
        });
      }

      // Update appropriate metric
      const updates: Partial<CampaignMetrics> = {};
      if (success) {
        updates.contactsReached = (metrics.contactsReached || 0) + 1;
      }

      await storage.updateCampaignMetrics(metrics.id, updates);
    } catch (error) {
      console.error('Error updating campaign metrics:', error);
    }
  }

  // Get campaign analytics
  static async getCampaignAnalytics(campaignId?: string): Promise<CampaignAnalytics> {
    try {
      const engagements = campaignId 
        ? await storage.getEngagementsByCampaign(campaignId)
        : await storage.getAllEngagements();

      const today = new Date().toISOString().split('T')[0];
      const todayEngagements = engagements.filter(e => 
        e.lastContactedAt && e.lastContactedAt.toISOString().split('T')[0] === today
      );

      return {
        totalContacts: engagements.length,
        contacted: engagements.filter(e => e.status === 'REACHED').length,
        responded: engagements.filter(e => e.status === 'RESPONDED').length,
        onboarded: engagements.filter(e => e.status === 'ONBOARDED').length,
        pending: engagements.filter(e => e.status === 'PENDING').length,
        failed: engagements.filter(e => e.status === 'FAILED').length,
        followUpsDue: engagements.filter(e => 
          e.followUpDate && e.followUpDate <= new Date()
        ).length,
        todayActivity: {
          reached: todayEngagements.filter(e => e.status === 'REACHED').length,
          responded: todayEngagements.filter(e => e.status === 'RESPONDED').length,
          onboarded: todayEngagements.filter(e => e.status === 'ONBOARDED').length,
        }
      };
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      return {
        totalContacts: 0,
        contacted: 0,
        responded: 0,
        onboarded: 0,
        pending: 0,
        failed: 0,
        followUpsDue: 0,
        todayActivity: { reached: 0, responded: 0, onboarded: 0 }
      };
    }
  }
}