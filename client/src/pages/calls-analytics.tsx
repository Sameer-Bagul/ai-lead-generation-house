import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, TrendingUp, Clock, Target, Download, Filter, MessageSquare, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CallTranscription } from "@/components/CallTranscription";
import type { Call, CallRecording } from "@shared/schema";

export default function CallsAnalyticsPage() {
  // Fetch calls data
  const { data: calls = [], isLoading } = useQuery<Call[]>({
    queryKey: ['/api/calls'],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const calculateSuccessRate = () => {
    if (!calls.length) return 0;
    const completedCalls = calls.filter((call) => call.status === 'completed').length;
    return Math.round((completedCalls / calls.length) * 100);
  };

  const calculateAverageDuration = () => {
    if (!calls.length) return 0;
    const totalDuration = calls
      .filter((call) => call.duration)
      .reduce((sum: number, call) => sum + (call.duration || 0), 0);
    return Math.round(totalDuration / calls.length);
  };

  const handleDownloadRecording = async (callId: string) => {
    try {
      // First check if recording exists
      const checkResponse = await fetch(`/api/calls/${callId}/recording`);
      if (!checkResponse.ok) {
        alert('No actual recording available for this call. Recordings are only available for real Twilio calls.');
        return;
      }

      // Use the server proxy endpoint for downloading
      const downloadUrl = `/api/calls/${callId}/recording/download`;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Recording not available');
        return;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `call-recording-${callId}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading recording:', error);
      alert('Failed to download recording - please try again');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Calls Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track and analyze AI calling performance
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calls.length}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateSuccessRate()}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(calculateAverageDuration())}</div>
              <p className="text-xs text-muted-foreground">
                -30s from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contact Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>
              Latest AI calling sessions and their outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Calls Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Start your first AI calling campaign to see analytics here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {calls.slice(0, 10).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{call.phoneNumber}</p>
                        <p className="text-sm text-gray-500">
                          {call.startTime ? new Date(call.startTime).toLocaleDateString() : 'N/A'} at{' '}
                          {call.startTime ? new Date(call.startTime).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(call.status)}>
                        {call.status}
                      </Badge>
                      {call.duration && (
                        <span className="text-sm text-gray-500">
                          {formatDuration(call.duration)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* View Transcription Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Transcript
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Call Transcription - {call.phoneNumber}</DialogTitle>
                          </DialogHeader>
                          <CallTranscription callId={call.id} isActive={false} />
                        </DialogContent>
                      </Dialog>
                      
                      {/* Download Recording Button - Only show if recording might exist */}
                      {call.twilioCallSid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadRecording(call.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Recording
                        </Button>
                      )}
                      {!call.twilioCallSid && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="No Twilio recording available"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          No Recording
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Success metrics by campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Group calls by campaign and show stats */}
              {Object.entries(
                calls.reduce((acc: Record<string, any>, call) => {
                  const campaignName = call.campaignId || 'Unknown Campaign';
                  if (!acc[campaignName]) {
                    acc[campaignName] = {
                      total: 0,
                      completed: 0,
                      totalDuration: 0,
                    };
                  }
                  acc[campaignName].total += 1;
                  if (call.status === 'completed') {
                    acc[campaignName].completed += 1;
                  }
                  if (call.duration) {
                    acc[campaignName].totalDuration += call.duration;
                  }
                  return acc;
                }, {} as Record<string, any>)
              ).map(([campaignName, stats]: [string, any]) => (
                <div
                  key={campaignName}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{campaignName}</h3>
                    <p className="text-sm text-gray-500">
                      {stats.total} calls • {Math.round((stats.completed / stats.total) * 100)}% success rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDuration(Math.round(stats.totalDuration / stats.total))}
                    </p>
                    <p className="text-sm text-gray-500">Avg Duration</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}