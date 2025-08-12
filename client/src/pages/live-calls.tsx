import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, PhoneCall, Clock, User, MessageSquare, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CallTranscription } from "@/components/CallTranscription";
import type { Call, Contact, Campaign, CallMessage } from "@shared/schema";

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

export default function LiveCallsPage() {
  // Fetch active calls - no need for separate state since React Query handles caching
  const { data: activeCalls = [], isLoading } = useQuery<ActiveCall[]>({
    queryKey: ['/api/calls/active'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const formatDuration = (startTime: Date) => {
    const duration = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Live Calls
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor active AI calls in real-time
        </p>
      </div>

      <div className="grid gap-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCalls.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeCalls.reduce((total: number, call: ActiveCall) => {
                  const duration = Math.floor((Date.now() - new Date(call.startTime).getTime()) / 1000 / 60);
                  return total + duration;
                }, 0)} min
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Calls List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Calls</CardTitle>
            <CardDescription>
              Currently running AI conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCalls.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Active Calls
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Start a campaign to see live calls here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCalls.map((call: ActiveCall) => (
                  <div
                    key={call.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(call.status)}`} />
                        <div>
                          <p className="font-medium">{call.phoneNumber}</p>
                          <p className="text-sm text-gray-500">
                            Campaign: {call.campaignId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={call.status === 'active' ? 'default' : 'secondary'}>
                          {call.status}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {formatDuration(call.startTime)}
                        </div>
                      </div>
                    </div>

                    {/* Conversation Preview */}
                    {call.conversationHistory && call.conversationHistory.length > 0 && (
                      <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mt-3">
                        <h4 className="text-sm font-medium mb-2">Recent Conversation</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {call.conversationHistory.slice(-3).map((turn: any, index: number) => (
                            <div key={index} className="text-sm">
                              <span className={`font-medium ${
                                turn.role === 'assistant' ? 'text-blue-600' : 'text-green-600'
                              }`}>
                                {turn.role === 'assistant' ? 'AI' : 'User'}:
                              </span>
                              <span className="ml-2 text-gray-700 dark:text-gray-300">
                                {turn.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>Contact: {call.contactId}</span>
                      </div>
                      
                      {/* Live Transcription Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Transcription
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Live Call Transcription - {call.phoneNumber}</DialogTitle>
                          </DialogHeader>
                          <CallTranscription callId={call.id} isActive={call.status === 'active'} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}