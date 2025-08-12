import { Request, Response } from 'express';
import { CampaignService } from '../services/CampaignService';
import { CampaignModel } from '../models/CampaignModel';

export class CampaignController {
  private campaignService: CampaignService;
  private campaignModel: CampaignModel;

  constructor() {
    this.campaignService = new CampaignService();
    this.campaignModel = new CampaignModel();
  }

  // Get all campaigns
  async getAllCampaigns(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await this.campaignModel.getAllWithPagination(
        Number(page), 
        Number(limit)
      );
      
      console.log(`📊 All Campaigns API: ${result.campaigns.length} campaigns, page ${page}/${result.pagination.totalPages}`);
      res.json(result);
    } catch (error) {
      console.error('Error fetching all campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  // Get campaigns for dashboard (today's activity)
  async getDashboardCampaigns(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const selectedDate = date ? new Date(date as string) : new Date();
      
      const campaigns = await this.campaignService.getTodaysActivities(selectedDate);
      
      console.log(`📊 Dashboard API: ${campaigns.length} campaigns for ${selectedDate.toDateString()}`);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching dashboard campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // Create new campaign
  async createCampaign(req: Request, res: Response) {
    try {
      const campaignData = req.body;
      const campaign = await this.campaignModel.create(campaignData);
      
      console.log(`✅ Campaign created: ${campaign.id}`);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }

  // Get campaign analytics
  async getCampaignAnalytics(req: Request, res: Response) {
    try {
      const analytics = await this.campaignService.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  // Get follow-ups
  async getFollowUps(req: Request, res: Response) {
    try {
      const followUps = await this.campaignService.getFollowUps();
      res.json(followUps);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      res.status(500).json({ error: 'Failed to fetch follow-ups' });
    }
  }

  // Start campaign
  async startCampaign(req: Request, res: Response) {
    try {
      const { campaignId } = req.params;
      const { contactIds, whatsappOnly, messageDelay } = req.body;
      
      const result = await this.campaignService.startCampaign(
        campaignId,
        contactIds,
        whatsappOnly,
        messageDelay
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error starting campaign:', error);
      res.status(500).json({ error: 'Failed to start campaign' });
    }
  }

  // Get day-wise analytics
  async getDayWiseAnalytics(req: Request, res: Response) {
    try {
      const analytics = await this.campaignService.getDayWiseAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching day-wise analytics:', error);
      res.status(500).json({ error: 'Failed to fetch day-wise analytics' });
    }
  }

  // Get total analytics
  async getTotalAnalytics(req: Request, res: Response) {
    try {
      const analytics = await this.campaignService.getTotalAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching total analytics:', error);
      res.status(500).json({ error: 'Failed to fetch total analytics' });
    }
  }
}