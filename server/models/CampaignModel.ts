import { db } from '../config/database';
import { campaigns, calls, whatsappMessages } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface CampaignWithStats {
  id: string;
  name: string;
  description: string | null;
  agentName: string;
  isActive: boolean;
  createdAt: Date;
  totalContacts: number;
  completedContacts: number;
  whatsappSent: number;
  avgDuration: number;
  successRate: number;
  status: string;
  channel: string;
}

export class CampaignModel {
  
  // Get all campaigns with pagination and statistics
  async getAllWithPagination(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    // Get campaigns from database
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset);

    // Get enriched campaigns with statistics
    const enrichedCampaigns = await Promise.all(
      allCampaigns.map(async (campaign) => await this.enrichCampaignWithStats(campaign))
    );

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns);
    const total = totalResult[0]?.count || 0;

    return {
      campaigns: enrichedCampaigns,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit)
      }
    };
  }

  // Enrich campaign with statistics
  private async enrichCampaignWithStats(campaign: any): Promise<CampaignWithStats> {
    // Get call statistics for this campaign
    const callStats = await db
      .select({
        totalCalls: sql<number>`count(*)`,
        completedCalls: sql<number>`count(case when status = 'completed' then 1 end)`,
        avgDuration: sql<number>`avg(duration)`,
        avgSuccessScore: sql<number>`avg(success_score)`
      })
      .from(calls)
      .where(eq(calls.campaignId, campaign.id));

    const stats = callStats[0] || { 
      totalCalls: 0, 
      completedCalls: 0, 
      avgDuration: 0, 
      avgSuccessScore: 0 
    };

    // Get WhatsApp messages sent for this campaign
    const whatsappCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.campaignId, campaign.id));

    const whatsappSent = whatsappCount[0]?.count || 0;

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      agentName: campaign.agentName,
      isActive: campaign.isActive,
      createdAt: campaign.createdAt,
      totalContacts: Number(stats.totalCalls) + Number(whatsappSent),
      completedContacts: Number(stats.completedCalls),
      whatsappSent: Number(whatsappSent),
      avgDuration: stats.avgDuration ? Math.round(Number(stats.avgDuration)) : 0,
      successRate: stats.avgSuccessScore ? Math.round(Number(stats.avgSuccessScore)) : 0,
      status: campaign.isActive ? "active" : "inactive",
      channel: Number(whatsappSent) > 0 ? (Number(stats.totalCalls) > 0 ? "BOTH" : "WHATSAPP") : "VOICE"
    };
  }

  // Create new campaign
  async create(campaignData: any) {
    const result = await db
      .insert(campaigns)
      .values(campaignData)
      .returning();
    
    return result[0];
  }

  // Get campaign by ID
  async getById(campaignId: string) {
    const result = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    return result[0] || null;
  }

  // Update campaign
  async update(campaignId: string, updateData: any) {
    const result = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    return result[0];
  }

  // Delete campaign
  async delete(campaignId: string) {
    await db
      .delete(campaigns)
      .where(eq(campaigns.id, campaignId));
    
    return true;
  }

  // Get active campaigns
  async getActive() {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.isActive, true))
      .orderBy(desc(campaigns.createdAt));
  }
}