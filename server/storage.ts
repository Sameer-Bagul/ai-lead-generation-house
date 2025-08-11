import { 
  users, contacts, campaigns, calls, callMessages, callTranscriptions, callRecordings, whatsappTemplates, bulkMessageJobs,
  contactEngagement, campaignMetrics, whatsappMessages,
  type User, type InsertUser, 
  type Contact, type InsertContact,
  type Campaign, type InsertCampaign,
  type Call, type InsertCall,
  type CallMessage, type InsertCallMessage,
  type CallTranscription, type InsertCallTranscription,
  type CallRecording, type InsertCallRecording,
  type WhatsAppTemplate, type InsertWhatsAppTemplate,
  type BulkMessageJob, type InsertBulkMessageJob,
  type ContactEngagement, type CampaignMetrics,
  type WhatsAppMessage, type InsertWhatsAppMessage,
  type DashboardStats, type CallWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, avg, sum, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contacts
  getContact(id: string): Promise<Contact | undefined>;
  getContactByPhone(phoneNumber: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<boolean>;
  getContacts(limit?: number): Promise<Contact[]>;
  getContactsPaginated(options: {
    limit: number;
    offset: number;
    searchTerm?: string;
    cities?: string[];
    states?: string[];
    statuses?: string[];
    engagementMin?: number;
    // Backward compatibility
    city?: string;
    state?: string;
  }): Promise<{ contacts: Contact[]; total: number; }>;
  getContactFilterOptions(): Promise<{ cities: string[]; states: string[]; statuses: string[]; }>;

  // Campaigns
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;

  // Calls
  createCall(call: InsertCall): Promise<Call>;
  getCall(id: string): Promise<Call | undefined>;
  getCalls(limit?: number): Promise<CallWithDetails[]>;
  updateCall(id: string, call: Partial<InsertCall>): Promise<Call>;
  deleteCall(id: string): Promise<boolean>;
  getCallsByCampaign(campaignId: string): Promise<Call[]>;
  getCallsByContact(contactId: string): Promise<Call[]>;
  getActiveCalls(): Promise<Call[]>;

  // Call Messages
  createCallMessage(message: InsertCallMessage): Promise<CallMessage>;
  getCallMessages(callId: string): Promise<CallMessage[]>;
  deleteCallMessage(id: string): Promise<boolean>;

  // Call Transcriptions
  createCallTranscription(transcription: InsertCallTranscription): Promise<CallTranscription>;
  getCallTranscriptions(callId: string): Promise<CallTranscription[]>;

  // Call Recordings
  createCallRecording(recording: InsertCallRecording): Promise<CallRecording>;
  getCallRecording(callId: string): Promise<CallRecording | null>;
  updateCallRecording(recordingId: string, updates: Partial<InsertCallRecording>): Promise<CallRecording>;

  // Dashboard Stats
  getDashboardStats(): Promise<DashboardStats>;

  // WhatsApp Templates
  createWhatsAppTemplate(template: InsertWhatsAppTemplate): Promise<WhatsAppTemplate>;
  getWhatsAppTemplates(): Promise<WhatsAppTemplate[]>;
  getWhatsAppTemplate(id: string): Promise<WhatsAppTemplate | undefined>;
  updateWhatsAppTemplate(id: string, template: Partial<InsertWhatsAppTemplate>): Promise<WhatsAppTemplate>;
  deleteWhatsAppTemplate(id: string): Promise<boolean>;

  // Contact Engagement (enhanced tracking)
  createContactEngagement(engagement: any): Promise<ContactEngagement>;
  updateContactEngagement(id: number, engagement: any): Promise<ContactEngagement>;
  getEngagementsByCampaign(campaignId: string): Promise<ContactEngagement[]>;
  getAllEngagements(): Promise<ContactEngagement[]>;
  getDueFollowUps(): Promise<ContactEngagement[]>;

  // Campaign Metrics
  createCampaignMetrics(metrics: any): Promise<CampaignMetrics>;
  updateCampaignMetrics(id: number, metrics: any): Promise<CampaignMetrics>;
  getCampaignMetrics(campaignId: string, date: string): Promise<CampaignMetrics | undefined>;

  // Bulk Message Jobs
  createBulkMessageJob(job: InsertBulkMessageJob): Promise<BulkMessageJob>;
  updateBulkMessageJob(job: BulkMessageJob): Promise<BulkMessageJob>;
  getBulkMessageJob(id: string): Promise<BulkMessageJob | undefined>;
  getBulkMessageJobs(): Promise<BulkMessageJob[]>;

  // WhatsApp Messages
  createWhatsAppMessage(message: InsertWhatsAppMessage): Promise<WhatsAppMessage>;
  getWhatsAppMessages(contactId?: string, limit?: number): Promise<WhatsAppMessage[]>;
  getWhatsAppMessage(id: string): Promise<WhatsAppMessage | undefined>;
  updateWhatsAppMessage(id: string, message: Partial<InsertWhatsAppMessage>): Promise<WhatsAppMessage | undefined>;
  deleteWhatsAppMessage(id: string): Promise<boolean>;
  getWhatsAppChatsByContact(): Promise<any[]>; // Grouped chats

  // Campaign Analytics
  getTotalCampaignAnalytics(): Promise<any>;
  getDayWiseAnalytics(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Contacts
  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getContactByPhone(phoneNumber: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.phone, phoneNumber));
    return contact || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getContacts(limit?: number): Promise<Contact[]> {
    // Bypass Drizzle ORM issue with raw SQL query
    const startTime = Date.now();
    
    try {
      const results = limit ? await db.execute(sql`
        SELECT id, name, phone, email, city, state, company, notes, 
               whatsapp_number as "whatsappNumber", 
               phone_number as "phoneNumber",
               imported_from as "importedFrom",
               created_at as "createdAt", 
               updated_at as "updatedAt"
        FROM contacts 
        WHERE phone IS NOT NULL AND phone != '' AND name != 'Unknown Lab'
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `) : await db.execute(sql`
        SELECT id, name, phone, email, city, state, company, notes, 
               whatsapp_number as "whatsappNumber", 
               phone_number as "phoneNumber",
               imported_from as "importedFrom",
               created_at as "createdAt", 
               updated_at as "updatedAt"
        FROM contacts 
        WHERE phone IS NOT NULL AND phone != '' AND name != 'Unknown Lab'
        ORDER BY created_at DESC
      `);
      
      // Extract rows from the database result
      const contacts = (results as any).rows || [];
      
      const endTime = Date.now();
      console.log(`📊 Raw SQL contacts query completed in ${endTime - startTime}ms - ${contacts.length} contacts`);
      
      return contacts as Contact[];
    } catch (error) {
      console.error('Error in getContacts:', error);
      const endTime = Date.now();
      console.log(`❌ Contacts query failed after ${endTime - startTime}ms`);
      throw error;
    }
  }

  async getContactsPaginated(options: {
    limit: number;
    offset: number;
    searchTerm?: string;
    cities?: string[];
    states?: string[];
    statuses?: string[];
    engagementMin?: number;
    // Backward compatibility
    city?: string;
    state?: string;
  }): Promise<{ contacts: Contact[]; total: number; }> {
    const startTime = Date.now();
    
    try {
      // Use simple approach similar to working getContacts() method
      let baseQuery = `
        SELECT id, name, phone, email, city, state, company, notes, 
               whatsapp_number as "whatsappNumber", 
               phone_number as "phoneNumber",
               imported_from as "importedFrom",
               created_at as "createdAt", 
               updated_at as "updatedAt"
        FROM contacts 
        WHERE phone IS NOT NULL AND phone != '' AND name != 'Unknown Lab'
      `;

      let countQuery = `
        SELECT COUNT(*) as total
        FROM contacts 
        WHERE phone IS NOT NULL AND phone != '' AND name != 'Unknown Lab'
      `;

      // Add filters if provided
      if (options.searchTerm) {
        const searchFilter = ` AND (name ILIKE '%${options.searchTerm}%' OR phone LIKE '%${options.searchTerm}%' OR email ILIKE '%${options.searchTerm}%' OR company ILIKE '%${options.searchTerm}%')`;
        baseQuery += searchFilter;
        countQuery += searchFilter;
      }
      
      // Handle multiple cities filter
      const citiesToFilter = options.cities && options.cities.length > 0 ? options.cities : (options.city ? [options.city] : []);
      if (citiesToFilter.length > 0) {
        const cityFilter = ` AND (${citiesToFilter.map(city => `city ILIKE '%${city}%'`).join(' OR ')})`;
        baseQuery += cityFilter;
        countQuery += cityFilter;
      }
      
      // Handle multiple states filter
      const statesToFilter = options.states && options.states.length > 0 ? options.states : (options.state ? [options.state] : []);
      if (statesToFilter.length > 0) {
        const stateFilter = ` AND (${statesToFilter.map(state => `state ILIKE '%${state}%'`).join(' OR ')})`;
        baseQuery += stateFilter;
        countQuery += stateFilter;
      }
      
      // Handle statuses filter (if we have a status column)
      if (options.statuses && options.statuses.length > 0) {
        const statusFilter = ` AND (${options.statuses.map(status => `status = '${status}'`).join(' OR ')})`;
        baseQuery += statusFilter;
        countQuery += statusFilter;
      }
      
      // Handle minimum engagement filter (if we have engagement data)
      if (options.engagementMin && options.engagementMin > 0) {
        // For now, we'll skip this filter as we don't have engagement count in the main contacts table
        // This would require joining with the engagement table or adding a computed column
      }

      // Get total count
      const countResult = await db.execute(sql.raw(countQuery));
      const total = parseInt((countResult as any).rows[0].total);

      // Get paginated results
      baseQuery += ` ORDER BY created_at DESC LIMIT ${options.limit} OFFSET ${options.offset}`;
      const dataResult = await db.execute(sql.raw(baseQuery));
      const contacts = (dataResult as any).rows || [];
      
      const endTime = Date.now();
      console.log(`📊 Paginated contacts query completed in ${endTime - startTime}ms - ${contacts.length}/${total} contacts`);
      
      return { contacts: contacts as Contact[], total };
    } catch (error) {
      console.error('Error in getContactsPaginated:', error);
      const endTime = Date.now();
      console.log(`❌ Paginated contacts query failed after ${endTime - startTime}ms`);
      throw error;
    }
  }

  async getContactFilterOptions(): Promise<{ cities: string[]; states: string[]; statuses: string[]; }> {
    try {
      const startTime = Date.now();
      
      // Get unique cities
      const citiesResult = await db.execute(sql`
        SELECT DISTINCT city 
        FROM contacts 
        WHERE city IS NOT NULL AND city != '' 
        ORDER BY city
      `);
      
      // Get unique states
      const statesResult = await db.execute(sql`
        SELECT DISTINCT state 
        FROM contacts 
        WHERE state IS NOT NULL AND state != '' 
        ORDER BY state
      `);
      
      const cities = ((citiesResult as any).rows || []).map((row: any) => row.city);
      const states = ((statesResult as any).rows || []).map((row: any) => row.state);
      const statuses = ['active', 'inactive', 'pending']; // Common statuses
      
      const endTime = Date.now();
      console.log(`📋 Filter options fetched in ${endTime - startTime}ms - ${cities.length} cities, ${states.length} states`);
      
      return { cities, states, statuses };
    } catch (error) {
      console.error('Error fetching contact filter options:', error);
      return { cities: [], states: [], statuses: [] };
    }
  }

  // Campaigns
  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set(campaign)
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign || undefined;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    // Delete associated engagement and metrics first
    await db.delete(contactEngagement).where(eq(contactEngagement.campaignId, id));
    await db.delete(campaignMetrics).where(eq(campaignMetrics.campaignId, id));
    
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount || 0) > 0;
  }

  // WhatsApp Templates
  async createWhatsAppTemplate(template: InsertWhatsAppTemplate): Promise<WhatsAppTemplate> {
    const [newTemplate] = await db.insert(whatsappTemplates).values(template).returning();
    return newTemplate;
  }

  async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    return await db.select().from(whatsappTemplates).orderBy(desc(whatsappTemplates.createdAt));
  }

  async getWhatsAppTemplate(id: string): Promise<WhatsAppTemplate | undefined> {
    const [template] = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.id, id));
    return template || undefined;
  }

  async updateWhatsAppTemplate(id: string, template: Partial<InsertWhatsAppTemplate>): Promise<WhatsAppTemplate> {
    const [updatedTemplate] = await db
      .update(whatsappTemplates)
      .set(template)
      .where(eq(whatsappTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteWhatsAppTemplate(id: string): Promise<boolean> {
    const result = await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Contact Engagement
  async createContactEngagement(engagement: any): Promise<ContactEngagement> {
    const [newEngagement] = await db.insert(contactEngagement).values(engagement).returning();
    return newEngagement;
  }

  async updateContactEngagement(id: number, engagement: any): Promise<ContactEngagement> {
    const [updatedEngagement] = await db
      .update(contactEngagement)
      .set({ ...engagement, updatedAt: new Date() })
      .where(eq(contactEngagement.id, id))
      .returning();
    return updatedEngagement;
  }

  async getEngagementsByCampaign(campaignId: string): Promise<ContactEngagement[]> {
    return await db.select().from(contactEngagement).where(eq(contactEngagement.campaignId, campaignId));
  }

  async getAllEngagements(): Promise<ContactEngagement[]> {
    return await db.select().from(contactEngagement).orderBy(desc(contactEngagement.createdAt));
  }

  async getDueFollowUps(): Promise<ContactEngagement[]> {
    const now = new Date();
    return await db.select().from(contactEngagement)
      .where(and(
        eq(contactEngagement.status, 'active')
      ))
      .orderBy(contactEngagement.nextFollowUp);
  }

  // Campaign Metrics
  async createCampaignMetrics(metrics: any): Promise<CampaignMetrics> {
    const [newMetrics] = await db.insert(campaignMetrics).values(metrics).returning();
    return newMetrics;
  }

  async updateCampaignMetrics(id: number, metrics: any): Promise<CampaignMetrics> {
    const [updatedMetrics] = await db
      .update(campaignMetrics)
      .set(metrics)
      .where(eq(campaignMetrics.id, id))
      .returning();
    return updatedMetrics;
  }

  async getCampaignMetrics(campaignId: string, date: string): Promise<CampaignMetrics | undefined> {
    const [metrics] = await db.select().from(campaignMetrics)
      .where(and(
        eq(campaignMetrics.campaignId, campaignId),
        eq(campaignMetrics.date, date)
      ));
    return metrics || undefined;
  }

  // Bulk Message Jobs
  async createBulkMessageJob(job: InsertBulkMessageJob): Promise<BulkMessageJob> {
    const [newJob] = await db.insert(bulkMessageJobs).values(job).returning();
    return newJob;
  }

  async updateBulkMessageJob(job: BulkMessageJob): Promise<BulkMessageJob> {
    const [updatedJob] = await db
      .update(bulkMessageJobs)
      .set(job)
      .where(eq(bulkMessageJobs.id, job.id))
      .returning();
    return updatedJob;
  }

  async getBulkMessageJob(id: string): Promise<BulkMessageJob | undefined> {
    const [job] = await db.select().from(bulkMessageJobs).where(eq(bulkMessageJobs.id, id));
    return job || undefined;
  }

  async getBulkMessageJobs(): Promise<BulkMessageJob[]> {
    return await db.select().from(bulkMessageJobs).orderBy(desc(bulkMessageJobs.createdAt));
  }

  // Calls
  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db.insert(calls).values(call).returning();
    return newCall;
  }

  async getCall(id: string): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call || undefined;
  }

  async getCalls(limit?: number): Promise<CallWithDetails[]> {
    const query = db
      .select({
        call: calls,
        contact: contacts,
        campaign: campaigns,
      })
      .from(calls)
      .leftJoin(contacts, eq(calls.contactId, contacts.id))
      .leftJoin(campaigns, eq(calls.campaignId, campaigns.id))
      .orderBy(desc(calls.startTime));

    if (limit) {
      query.limit(limit);
    }

    const results = await query;
    return results.map(result => ({
      ...result.call,
      contact: result.contact || undefined,
      campaign: result.campaign || undefined,
    }));
  }

  async updateCall(id: string, call: Partial<InsertCall>): Promise<Call> {
    const [updatedCall] = await db
      .update(calls)
      .set(call)
      .where(eq(calls.id, id))
      .returning();
    return updatedCall;
  }

  async deleteCall(id: string): Promise<boolean> {
    const result = await db.delete(calls).where(eq(calls.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCallsByCampaign(campaignId: string): Promise<Call[]> {
    return await db.select().from(calls).where(eq(calls.campaignId, campaignId));
  }

  async getCallsByContact(contactId: string): Promise<Call[]> {
    return await db.select().from(calls).where(eq(calls.contactId, contactId));
  }

  async getActiveCalls(): Promise<Call[]> {
    return await db.select().from(calls).where(eq(calls.status, 'active'));
  }

  // Call Messages
  async createCallMessage(message: InsertCallMessage): Promise<CallMessage> {
    const [newMessage] = await db.insert(callMessages).values(message).returning();
    return newMessage;
  }

  async getCallMessages(callId: string): Promise<CallMessage[]> {
    return await db
      .select()
      .from(callMessages)
      .where(eq(callMessages.callId, callId))
      .orderBy(desc(callMessages.timestamp));
  }

  async deleteCallMessage(id: string): Promise<boolean> {
    const result = await db.delete(callMessages).where(eq(callMessages.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Call Transcriptions for real-time live transcription display
  async createCallTranscription(transcription: InsertCallTranscription): Promise<CallTranscription> {
    const [result] = await db.insert(callTranscriptions).values(transcription).returning();
    return result;
  }

  async getCallTranscriptions(callId: string): Promise<CallTranscription[]> {
    return await db.select()
      .from(callTranscriptions)
      .where(eq(callTranscriptions.callId, callId))
      .orderBy(callTranscriptions.timestamp);
  }

  // Call Recordings for MP4 download functionality
  async createCallRecording(recording: InsertCallRecording): Promise<CallRecording> {
    const [result] = await db.insert(callRecordings).values(recording).returning();
    return result;
  }

  async getCallRecording(callId: string): Promise<CallRecording | null> {
    const [result] = await db.select()
      .from(callRecordings)
      .where(eq(callRecordings.callId, callId))
      .limit(1);
    return result || null;
  }

  async updateCallRecording(recordingId: string, updates: Partial<InsertCallRecording>): Promise<CallRecording> {
    const [result] = await db.update(callRecordings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(callRecordings.id, recordingId))
      .returning();
    return result;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const [contactCount] = await db.select({ count: count() }).from(contacts);
    const [campaignCount] = await db.select({ count: count() }).from(campaigns);
    const [callCount] = await db.select({ count: count() }).from(calls);
    const [activeCallCount] = await db.select({ count: count() }).from(calls).where(eq(calls.status, 'active'));
    const [jobCount] = await db.select({ totalSent: sum(bulkMessageJobs.sentMessages) }).from(bulkMessageJobs);
    const [completedCalls] = await db.select({ count: count() }).from(calls).where(eq(calls.status, 'completed'));
    
    return {
      totalContacts: contactCount.count || 0,
      totalCampaigns: campaignCount.count || 0,
      totalCalls: callCount.count || 0,
      activeCalls: activeCallCount.count || 0,
      totalMessages: Number(jobCount.totalSent) || 0,
      deliveryRate: 95, // Calculate from actual delivery data
      engagementRate: 12, // Calculate from engagement data
      averageResponseTime: 24, // Calculate from response times
      successRate: completedCalls.count && callCount.count 
        ? Math.round((completedCalls.count / callCount.count) * 100)
        : 0,
    };
  }

  // WhatsApp Messages
  async createWhatsAppMessage(message: InsertWhatsAppMessage): Promise<WhatsAppMessage> {
    const [newMessage] = await db.insert(whatsappMessages).values(message).returning();
    return newMessage;
  }

  async getWhatsAppMessages(contactId?: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    const query = db.select().from(whatsappMessages).orderBy(desc(whatsappMessages.createdAt)).limit(limit);
    
    if (contactId) {
      return await query.where(eq(whatsappMessages.contactId, contactId));
    }
    
    return await query;
  }

  async getWhatsAppMessage(id: string): Promise<WhatsAppMessage | undefined> {
    const [message] = await db.select().from(whatsappMessages).where(eq(whatsappMessages.id, id));
    return message || undefined;
  }

  async updateWhatsAppMessage(id: string, message: Partial<InsertWhatsAppMessage>): Promise<WhatsAppMessage | undefined> {
    const [updated] = await db.update(whatsappMessages)
      .set(message)
      .where(eq(whatsappMessages.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWhatsAppMessage(id: string): Promise<boolean> {
    const result = await db.delete(whatsappMessages).where(eq(whatsappMessages.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getWhatsAppMessageByWhatsAppId(whatsappMessageId: string): Promise<WhatsAppMessage[]> {
    return await db.select().from(whatsappMessages).where(eq(whatsappMessages.whatsappMessageId, whatsappMessageId));
  }





  async getWhatsAppChatsByContact(): Promise<any[]> {
    try {
      // Get all messages with contact info, then organize by contact
      const messages = await db.select({
        id: whatsappMessages.id,
        contactId: whatsappMessages.contactId,
        contactName: contacts.name,
        contactPhone: contacts.phone,
        message: whatsappMessages.message,
        createdAt: whatsappMessages.createdAt,
        status: whatsappMessages.status,
        direction: whatsappMessages.direction,
        messageType: whatsappMessages.messageType
      })
      .from(whatsappMessages)
      .innerJoin(contacts, eq(whatsappMessages.contactId, contacts.id))
      .orderBy(desc(whatsappMessages.createdAt));

      console.log(`📱 Found ${messages.length} WhatsApp messages`);
      
      // Group messages by contact to create chats
      const chatMap = new Map();
      
      messages.forEach(msg => {
        const contactId = msg.contactId;
        
        if (!chatMap.has(contactId)) {
          chatMap.set(contactId, {
            id: contactId,
            contactPhone: msg.contactPhone,
            contactName: msg.contactName,
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt.toISOString(),
            unreadCount: 0,
            status: 'active',
            messages: []
          });
        }
        
        const chat = chatMap.get(contactId);
        
        // Add message to chat
        chat.messages.push({
          id: msg.id,
          chatId: contactId,
          contactPhone: msg.contactPhone,
          contactName: msg.contactName,
          message: msg.message,
          direction: msg.direction,
          status: msg.status,
          timestamp: msg.createdAt.toISOString(),
          messageType: msg.messageType || 'text'
        });
        
        // Update last message if this is newer
        if (new Date(msg.createdAt) > new Date(chat.lastMessageTime)) {
          chat.lastMessage = msg.message;
          chat.lastMessageTime = msg.createdAt.toISOString();
        }
      });
      
      // Convert map to array and sort by last message time
      const chats = Array.from(chatMap.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      
      console.log(`💬 Returning ${chats.length} WhatsApp chats`);
      return chats;
      
    } catch (error) {
      console.error('Error fetching WhatsApp chats:', error);
      return [];
    }
  }

  // Campaign Analytics Implementation
  async getTotalCampaignAnalytics(): Promise<any> {
    try {
      // Get all WhatsApp messages to calculate analytics
      const allMessages = await db.select().from(whatsappMessages);
      const allContacts = await db.select().from(contacts);
      
      // Calculate basic stats
      const totalCustomersApproached = allMessages.length;
      const positiveResponses = allMessages.filter(msg => 
        msg.status === 'read' || (msg.message && msg.message.toLowerCase().includes('yes'))
      ).length;
      const negativeResponses = allMessages.filter(msg => 
        msg.message && (msg.message.toLowerCase().includes('no') || msg.message.toLowerCase().includes('stop'))
      ).length;
      const pendingResponses = allMessages.filter(msg => msg.status === 'pending').length;
      
      // Calculate response and conversion rates
      const totalResponses = positiveResponses + negativeResponses;
      const responseRate = totalCustomersApproached > 0 ? (totalResponses / totalCustomersApproached) * 100 : 0;
      const conversionRate = totalCustomersApproached > 0 ? (positiveResponses / totalCustomersApproached) * 100 : 0;
      
      // City-wise data
      const cityWiseMap = new Map();
      for (const message of allMessages) {
        try {
          const contact = allContacts.find(c => c.id === message.contactId);
          if (contact && contact.city) {
            const city = contact.city;
            if (!cityWiseMap.has(city)) {
              cityWiseMap.set(city, { city, count: 0, positive: 0, negative: 0 });
            }
            const cityData = cityWiseMap.get(city);
            cityData.count++;
            
            if (message.status === 'read' || (message.message && message.message.toLowerCase().includes('yes'))) {
              cityData.positive++;
            } else if (message.message && (message.message.toLowerCase().includes('no') || message.message.toLowerCase().includes('stop'))) {
              cityData.negative++;
            }
          }
        } catch (err) {
          // Skip invalid contacts
          continue;
        }
      }
      
      const cityWiseData = Array.from(cityWiseMap.values());
      
      // Day-wise data for last 30 days
      const dayWiseMap = new Map();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMessages = allMessages.filter(msg => 
        msg.createdAt && new Date(msg.createdAt) >= thirtyDaysAgo
      );
      
      for (const message of recentMessages) {
        if (!message.createdAt) continue;
        const dateKey = new Date(message.createdAt).toISOString().split('T')[0];
        
        if (!dayWiseMap.has(dateKey)) {
          dayWiseMap.set(dateKey, { date: dateKey, pitched: 0, positive: 0, negative: 0 });
        }
        
        const dayData = dayWiseMap.get(dateKey);
        dayData.pitched++;
        
        if (message.status === 'read' || (message.message && message.message.toLowerCase().includes('yes'))) {
          dayData.positive++;
        } else if (message.message && (message.message.toLowerCase().includes('no') || message.message.toLowerCase().includes('stop'))) {
          dayData.negative++;
        }
      }
      
      const dayWiseData = Array.from(dayWiseMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return {
        totalCustomersApproached,
        positiveResponses,
        negativeResponses,
        pendingResponses,
        responseRate,
        conversionRate,
        cityWiseData,
        dayWiseData
      };
    } catch (error) {
      console.error('Error calculating total campaign analytics:', error);
      return {
        totalCustomersApproached: 0,
        positiveResponses: 0,
        negativeResponses: 0,
        pendingResponses: 0,
        responseRate: 0,
        conversionRate: 0,
        cityWiseData: [],
        dayWiseData: []
      };
    }
  }

  async getDayWiseAnalytics(): Promise<any[]> {
    try {
      // Get messages from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMessages = await db.select()
        .from(whatsappMessages)
        .where(sql`${whatsappMessages.createdAt} >= ${thirtyDaysAgo}`);
      
      const dayWiseMap = new Map();
      
      for (const message of recentMessages) {
        if (!message.createdAt) continue;
        const dateKey = new Date(message.createdAt).toISOString().split('T')[0];
        
        if (!dayWiseMap.has(dateKey)) {
          dayWiseMap.set(dateKey, { date: dateKey, pitched: 0, positive: 0, negative: 0 });
        }
        
        const dayData = dayWiseMap.get(dateKey);
        dayData.pitched++;
        
        if (message.status === 'read' || (message.message && message.message.toLowerCase().includes('yes'))) {
          dayData.positive++;
        } else if (message.message && (message.message.toLowerCase().includes('no') || message.message.toLowerCase().includes('stop'))) {
          dayData.negative++;
        }
      }
      
      return Array.from(dayWiseMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error calculating day-wise analytics:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();