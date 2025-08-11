import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/sidebar';
import { 
  Clock, 
  Phone, 
  MessageCircle, 
  TrendingUp, 
  Activity,
  Timer,
  BarChart3,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';

interface CampaignAnalytics {
  campaignId: string;
  totalCalls: number;
  callBreakdown: {
    completed: number;
    failed: number;
    active: number;
  };
  timingAnalysis: {
    totalDuration: number;
    averageDuration: number;
    averageAiResponseTime: number;
    longestCall: number;
    shortestCall: number;
  };
  successMetrics: {
    averageSuccessScore: number;
    whatsappSentCount: number;
    emailSentCount: number;
    dataCollectedCount: number;
  };
  recentCalls: Array<{
    id: string;
    contactName: string;
    phoneNumber: string;
    duration: number;
    status: string;
    startTime: string;
    endTime: string;
    aiResponseTime: number;
    successScore: number;
    whatsappSent: boolean;
    emailSent: boolean;
    conversationSummary?: string;
  }>;
}

interface CallTimingDetails {
  callId: string;
  callOverview: {
    totalDuration: number;
    startTime: string;
    endTime: string;
    status: string;
  };
  stageTimings: {
    callInitiation: {
      description: string;
      estimatedDuration: number;
    };
    conversationFlow: {
      description: string;
      estimatedDuration: number;
      aiProcessingTime: number;
      totalSpeechSegments: number;
      totalSpeechDuration: number;
    };
    messageProcessing: {
      description: string;
      whatsappSent: boolean;
      emailSent: boolean;
      messagesCount: number;
    };
  };
  conversationLog: Array<{
    timestamp: string;
    role: string;
    content: string;
    timeSinceStart: number;
  }>;
  speechSegments: Array<{
    timestamp: string;
    speaker: string;
    transcript: string;
    duration: number;
    confidence: number;
    timeSinceStart: number;
  }>;
  followUpActions: Array<{
    timestamp: string;
    status: string;
    templateName: string;
    deliveredAt: string;
    readAt: string;
    timeSinceCallEnd: number;
  }>;
}

export default function CampaignTimingAnalytics() {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedCallId, setSelectedCallId] = useState<string>('');

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ['/api/campaigns'],
  });

  // Fetch detailed campaign analytics
  const { data: campaignAnalytics, isLoading: analyticsLoading } = useQuery<CampaignAnalytics>({
    queryKey: ['/api/campaigns', selectedCampaignId, 'detailed-analytics'],
    queryFn: () => fetch(`/api/campaigns/${selectedCampaignId}/detailed-analytics`).then(res => res.json()),
    enabled: !!selectedCampaignId,
  });

  // Fetch call timing details
  const { data: callTimingDetails, isLoading: timingLoading } = useQuery<CallTimingDetails>({
    queryKey: ['/api/calls', selectedCallId, 'timing-details'],
    queryFn: () => fetch(`/api/calls/${selectedCallId}/timing-details`).then(res => res.json()),
    enabled: !!selectedCallId,
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuccessColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaign Timing Analytics</h1>
            <p className="text-muted-foreground">
              Detailed timing analysis and call flow breakdowns for your campaigns
            </p>
          </div>
        </div>

        {/* Campaign Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Select Campaign for Analysis
            </CardTitle>
            <CardDescription>
              Choose a campaign to view detailed timing analytics and call flow analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaigns.map((campaign: any) => (
                <Card key={campaign.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${selectedCampaignId === campaign.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedCampaignId(campaign.id)}>
                  <CardContent className="p-4">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{campaign.language}</Badge>
                      <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                        {campaign.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Analytics */}
        {selectedCampaignId && campaignAnalytics && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Campaign Overview</TabsTrigger>
              <TabsTrigger value="timing">Timing Analysis</TabsTrigger>
              <TabsTrigger value="calls">Call Details</TabsTrigger>
              <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                        <p className="text-2xl font-bold">{campaignAnalytics.totalCalls}</p>
                      </div>
                      <Phone className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Duration</p>
                        <p className="text-2xl font-bold">{formatDuration(campaignAnalytics.timingAnalysis.averageDuration)}</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                        <p className="text-2xl font-bold">
                          {Math.round((campaignAnalytics.callBreakdown.completed / campaignAnalytics.totalCalls) * 100)}%
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg AI Response</p>
                        <p className="text-2xl font-bold">{campaignAnalytics.timingAnalysis.averageAiResponseTime}ms</p>
                      </div>
                      <Zap className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Call Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Completed Calls
                      </span>
                      <span className="font-medium">{campaignAnalytics.callBreakdown.completed}</span>
                    </div>
                    <Progress value={(campaignAnalytics.callBreakdown.completed / campaignAnalytics.totalCalls) * 100} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Failed Calls
                      </span>
                      <span className="font-medium">{campaignAnalytics.callBreakdown.failed}</span>
                    </div>
                    <Progress value={(campaignAnalytics.callBreakdown.failed / campaignAnalytics.totalCalls) * 100} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        Active Calls
                      </span>
                      <span className="font-medium">{campaignAnalytics.callBreakdown.active}</span>
                    </div>
                    <Progress value={(campaignAnalytics.callBreakdown.active / campaignAnalytics.totalCalls) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timing" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Duration Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Campaign Duration:</span>
                      <span className="font-bold">{formatDuration(campaignAnalytics.timingAnalysis.totalDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Call Duration:</span>
                      <span className="font-bold">{formatDuration(campaignAnalytics.timingAnalysis.averageDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longest Call:</span>
                      <span className="font-bold">{formatDuration(campaignAnalytics.timingAnalysis.longestCall)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shortest Call:</span>
                      <span className="font-bold">{formatDuration(campaignAnalytics.timingAnalysis.shortestCall)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      AI Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average AI Response Time:</span>
                      <span className="font-bold">{campaignAnalytics.timingAnalysis.averageAiResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Success Score:</span>
                      <span className="font-bold">{campaignAnalytics.successMetrics.averageSuccessScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WhatsApp Messages Sent:</span>
                      <span className="font-bold">{campaignAnalytics.successMetrics.whatsappSentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Collection Success:</span>
                      <span className="font-bold">{campaignAnalytics.successMetrics.dataCollectedCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="calls" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Calls with Timing Details</CardTitle>
                  <CardDescription>
                    Click on any call to view detailed timing breakdown and conversation flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>AI Response Time</TableHead>
                        <TableHead>Success Score</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignAnalytics.recentCalls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell className="font-medium">{call.contactName}</TableCell>
                          <TableCell>{call.phoneNumber}</TableCell>
                          <TableCell>{formatDuration(call.duration || 0)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(call.status)}>
                              {call.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{call.aiResponseTime}ms</TableCell>
                          <TableCell>
                            <Badge className={getSuccessColor(call.successScore || 0)}>
                              {call.successScore || 0}/100
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {call.whatsappSent && <MessageCircle className="h-4 w-4 text-green-500" />}
                              {call.emailSent && <MessageCircle className="h-4 w-4 text-blue-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedCallId(call.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Call Timing Details - {call.contactName}</DialogTitle>
                                </DialogHeader>
                                {selectedCallId === call.id && callTimingDetails && (
                                  <CallTimingDetailsView timingDetails={callTimingDetails} />
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Success Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Average Success Score</span>
                        <span className="font-bold">{campaignAnalytics.successMetrics.averageSuccessScore}/100</span>
                      </div>
                      <Progress value={campaignAnalytics.successMetrics.averageSuccessScore} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>WhatsApp Follow-up Rate</span>
                        <span className="font-bold">
                          {Math.round((campaignAnalytics.successMetrics.whatsappSentCount / campaignAnalytics.totalCalls) * 100)}%
                        </span>
                      </div>
                      <Progress value={(campaignAnalytics.successMetrics.whatsappSentCount / campaignAnalytics.totalCalls) * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Data Collection Rate</span>
                        <span className="font-bold">
                          {Math.round((campaignAnalytics.successMetrics.dataCollectedCount / campaignAnalytics.totalCalls) * 100)}%
                        </span>
                      </div>
                      <Progress value={(campaignAnalytics.successMetrics.dataCollectedCount / campaignAnalytics.totalCalls) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Efficiency Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Calls per Hour:</span>
                      <span className="font-bold">
                        {Math.round(campaignAnalytics.totalCalls / (campaignAnalytics.timingAnalysis.totalDuration / 3600))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average AI Response:</span>
                      <span className="font-bold">{campaignAnalytics.timingAnalysis.averageAiResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success to Time Ratio:</span>
                      <span className="font-bold">
                        {Math.round((campaignAnalytics.successMetrics.averageSuccessScore / campaignAnalytics.timingAnalysis.averageDuration) * 10) / 10}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Component to display detailed call timing information
function CallTimingDetailsView({ timingDetails }: { timingDetails: CallTimingDetails }) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Call Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="font-bold">{formatDuration(timingDetails.callOverview.totalDuration)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Time</p>
              <p className="font-bold">{formatTime(timingDetails.callOverview.startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Time</p>
              <p className="font-bold">{formatTime(timingDetails.callOverview.endTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={timingDetails.callOverview.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}>
                {timingDetails.callOverview.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage Timings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Call Flow Stages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <PlayCircle className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">1. Call Initiation</p>
                <p className="text-sm text-muted-foreground">{timingDetails.stageTimings.callInitiation.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatDuration(timingDetails.stageTimings.callInitiation.estimatedDuration)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">2. Conversation Flow</p>
                <p className="text-sm text-muted-foreground">{timingDetails.stageTimings.conversationFlow.description}</p>
                <div className="mt-1 text-xs space-y-1">
                  <p>AI Processing: {timingDetails.stageTimings.conversationFlow.aiProcessingTime}ms</p>
                  <p>Speech Segments: {timingDetails.stageTimings.conversationFlow.totalSpeechSegments}</p>
                  <p>Total Speech Duration: {formatDuration(timingDetails.stageTimings.conversationFlow.totalSpeechDuration)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatDuration(timingDetails.stageTimings.conversationFlow.estimatedDuration)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="font-medium">3. Follow-up Processing</p>
                <p className="text-sm text-muted-foreground">{timingDetails.stageTimings.messageProcessing.description}</p>
                <div className="mt-1 text-xs space-y-1">
                  <p>WhatsApp Sent: {timingDetails.stageTimings.messageProcessing.whatsappSent ? 'Yes' : 'No'}</p>
                  <p>Email Sent: {timingDetails.stageTimings.messageProcessing.emailSent ? 'Yes' : 'No'}</p>
                  <p>Messages Count: {timingDetails.stageTimings.messageProcessing.messagesCount}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Log */}
      {timingDetails.conversationLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversation Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {timingDetails.conversationLog.map((message, index) => (
                <div key={index} className={`flex gap-3 p-3 rounded-lg ${message.role === 'assistant' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex-shrink-0">
                    <Badge variant={message.role === 'assistant' ? 'default' : 'secondary'}>
                      {message.role === 'assistant' ? 'AI' : 'User'}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">+{formatDuration(message.timeSinceStart)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</p>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speech Segments */}
      {timingDetails.speechSegments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Speech Recognition Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {timingDetails.speechSegments.map((segment, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                  <Badge variant={segment.speaker === 'ai_agent' ? 'default' : 'outline'}>
                    {segment.speaker === 'ai_agent' ? 'AI' : 'Customer'}
                  </Badge>
                  <div className="flex-1">
                    <p>"{segment.transcript}"</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>+{formatDuration(segment.timeSinceStart)}</p>
                    <p>{segment.duration}s</p>
                    <p>{Math.round(segment.confidence * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Actions */}
      {timingDetails.followUpActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Follow-up Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timingDetails.followUpActions.map((action, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded text-sm">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">WhatsApp: {action.templateName}</p>
                    <p className="text-muted-foreground">Status: {action.status}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>Sent: {formatTime(action.timestamp)}</p>
                    {action.deliveredAt && <p>Delivered: {formatTime(action.deliveredAt)}</p>}
                    {action.readAt && <p>Read: {formatTime(action.readAt)}</p>}
                    <p className="text-muted-foreground">
                      +{formatDuration(Math.abs(action.timeSinceCallEnd))} after call
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}