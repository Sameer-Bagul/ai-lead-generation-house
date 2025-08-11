import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TotalCampaignAnalytics } from '@/components/TotalCampaignAnalytics';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  Phone, 
  MessageSquare, 
  Eye, 
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

const formatToDateDisplayString = (date: Date) => {
  return format(date, 'MMM dd, yyyy');
};

export default function CampaignDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today");

  // Get campaigns data with query - only real data
  const dateString = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['/api/campaigns/dashboard', dateString],
    queryFn: () => fetch(`/api/campaigns/dashboard?date=${dateString}`).then(res => res.json()),
    select: (data: any) => data || []
  });

  // Get follow-ups data
  const { data: followUps } = useQuery({
    queryKey: ['/api/campaigns/followups'],
    select: (data: any) => data || []
  });

  // Get all campaigns data
  const { data: allCampaignsData, isLoading: isLoadingAllCampaigns } = useQuery({
    queryKey: ['/api/campaigns/all', 1],
    queryFn: () => fetch('/api/campaigns/all?page=1&limit=20').then(res => res.json()),
    select: (data: any) => data || { campaigns: [], pagination: {} }
  });

  // Filter campaigns based on actual data only
  const todaysCampaigns = (campaigns || []).filter((campaign: any) => 
    campaign.contacts && campaign.contacts.some((contact: any) => 
      contact.messageTime && isToday(new Date(contact.messageTime))
    )
  );

  const todaysContacts = (campaigns || []).flatMap((campaign: any) => 
    campaign.contacts ? campaign.contacts.filter((contact: any) => 
      contact.messageTime && isToday(new Date(contact.messageTime))
    ) : []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'sent': 
      case 'delivered': 
      case 'read': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getNextActionLabel = (action: string) => {
    switch (action) {
      case 'follow_up_call': return 'Follow-up Call';
      case 'send_brochure': return 'Send Brochure';
      case 'schedule_demo': return 'Schedule Demo';
      case 'close_deal': return 'Close Deal';
      default: return 'Pending Review';
    }
  };

  const getNextActionColor = (action: string) => {
    switch (action) {
      case 'follow_up_call': return 'bg-blue-500';
      case 'send_brochure': return 'bg-green-500';
      case 'schedule_demo': return 'bg-purple-500';
      case 'close_deal': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const goToToday = () => {
    const now = new Date();
    console.log('Setting date to today:', now.toISOString());
    setSelectedDate(now);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading campaign data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {formatToDateDisplayString(selectedDate)}
          </div>
        </div>
      </div>

      {/* Total Campaign Analytics - Lifetime Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold tracking-tight">Total Campaign Analytics</h3>
          <Badge variant="outline">Lifetime Stats</Badge>
        </div>
        <TotalCampaignAnalytics />
      </div>

      {/* Today's Campaign Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold tracking-tight">Today's Activity</h3>
          <Badge variant="secondary">{formatToDateDisplayString(selectedDate)}</Badge>
        </div>
        
        {/* Today's Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaysCampaigns.length > 0 ? 'Active campaigns running' : 'No campaigns today'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts Reached</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysContacts.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaysContacts.length > 0 ? 'From real campaign activity' : 'No contacts reached today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todaysContacts.length > 0 
                ? Math.round((todaysContacts.filter((c: any) => c.engagementScore > 70).length / todaysContacts.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysContacts.length > 0 ? 'Based on engagement scores' : 'No data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUps?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {followUps?.length > 0 ? 'Contacts need follow-up' : 'No follow-ups needed'}
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today's Activity</TabsTrigger>
          <TabsTrigger value="pastcampaigns">Past Campaigns</TabsTrigger>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Contact Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Call Status</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysContacts.length > 0 ? (
                    todaysContacts.map((contact: any) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contact.contactName}</div>
                            <div className="text-sm text-gray-500">{contact.company || 'Unknown Company'}</div>
                            <div className="text-xs text-gray-400">{contact.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(contact.callStatus)}>
                            {contact.callStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={getStatusColor(contact.messageStatus)}>
                              {contact.messageStatus}
                            </Badge>
                            {contact.messageTime && (
                              <div className="text-xs text-gray-500">
                                {format(new Date(contact.messageTime), 'HH:mm')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs text-sm">
                            {contact.conversationSummary || 'WhatsApp message sent'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getNextActionColor(contact.nextAction)}>
                            {getNextActionLabel(contact.nextAction)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            Recommended
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{contact.engagementScore}</div>
                            <Progress 
                              value={contact.engagementScore} 
                              className="w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          No campaign activities for today. Start a new campaign to see data here.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pastcampaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
              <p className="text-sm text-muted-foreground">
                All your past campaigns and their performance metrics
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingAllCampaigns ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading campaign history...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCampaignsData?.campaigns?.length > 0 ? (
                      allCampaignsData.campaigns.map((campaign: any) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              {campaign.description && (
                                <div className="text-xs text-gray-500 max-w-xs truncate">
                                  {campaign.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{campaign.agentName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              campaign.channel === 'VOICE' ? 'bg-blue-50 text-blue-700' :
                              campaign.channel === 'WHATSAPP' ? 'bg-green-50 text-green-700' :
                              'bg-purple-50 text-purple-700'
                            }>
                              {campaign.channel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{campaign.totalContacts}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{campaign.completedContacts}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{campaign.successRate}%</div>
                              <Progress 
                                value={campaign.successRate} 
                                className="w-16"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              campaign.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                            }>
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-gray-500">
                            No campaigns found. Create your first campaign to get started.
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysCampaigns.length > 0 ? (
                  todaysCampaigns.map((campaign: any) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-gray-500">
                            {campaign.totalContacts} contacts • {campaign.completedContacts} completed • {campaign.successRate}% success rate
                          </p>
                        </div>
                        <Badge className={campaign.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Progress value={(campaign.completedContacts / campaign.totalContacts) * 100} className="w-full" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No active campaigns for today.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(followUps) && followUps.length > 0 ? (
                    followUps.map((contact: any) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contact.contactName}</div>
                            <div className="text-sm text-gray-500">{contact.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getNextActionColor(contact.nextAction)}>
                            {getNextActionLabel(contact.nextAction)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contact.nextFollowUp && (
                            <div>
                              <div className="font-medium">
                                {isToday(new Date(contact.nextFollowUp)) ? 'Today' : 
                                 isTomorrow(new Date(contact.nextFollowUp)) ? 'Tomorrow' :
                                 format(new Date(contact.nextFollowUp), 'MMM dd')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(contact.nextFollowUp), 'HH:mm')}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">Recent message activity</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contact.engagementScore > 70 ? 'default' : 'secondary'}>
                            {contact.engagementScore > 70 ? 'High' : 'Medium'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          No follow-ups needed at this time. Check back after running campaigns.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}