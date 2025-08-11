import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { CallTranscription, CallRecording } from '@shared/schema';

interface CallTranscriptionProps {
  callId: string;
  isActive?: boolean;
}

export function CallTranscription({ callId, isActive = false }: CallTranscriptionProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  // Fetch transcriptions with real-time updates for active calls
  const { data: transcriptions = [], refetch: refetchTranscriptions } = useQuery({
    queryKey: ['call-transcriptions', callId],
    queryFn: async () => {
      const response = await fetch(`/api/calls/${callId}/transcriptions`);
      if (!response.ok) throw new Error('Failed to fetch transcriptions');
      return response.json() as Promise<CallTranscription[]>;
    },
    refetchInterval: isActive ? 2000 : false, // Poll every 2 seconds for active calls
  });

  // Fetch recording download URL
  const { data: recording } = useQuery({
    queryKey: ['call-recording', callId],
    queryFn: async () => {
      const response = await fetch(`/api/calls/${callId}/recording`);
      if (!response.ok) return null;
      return response.json() as Promise<CallRecording>;
    },
  });

  // Auto-scroll to bottom when new transcriptions arrive
  useEffect(() => {
    if (autoScroll && transcriptions.length > 0) {
      const scrollArea = document.getElementById(`transcription-scroll-${callId}`);
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [transcriptions, autoScroll, callId]);

  const handleDownloadRecording = async () => {
    if (!recording) return;
    
    try {
      // Use the server proxy endpoint for downloading
      const response = await fetch(`/api/calls/${callId}/recording/download`);
      
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
      link.download = `call-recording-${callId}.${recording.mp4Url ? 'mp4' : 'wav'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading recording:', error);
      alert('Failed to download recording - please try again');
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSpeakerIcon = (speaker: string) => {
    return speaker === 'ai_agent' ? '🤖' : '👤';
  };

  const getSpeakerColor = (speaker: string) => {
    return speaker === 'ai_agent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg">Call Transcription</CardTitle>
          {isActive && (
            <Badge variant="secondary" className="animate-pulse">
              <Volume2 className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {autoScroll ? 'Disable' : 'Enable'} Auto-scroll
          </Button>
          
          {recording && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadRecording}
              disabled={recording.conversionStatus === 'processing'}
            >
              <Download className="w-4 h-4 mr-2" />
              Download {recording.mp4Url ? 'MP4' : 'Audio'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea 
          id={`transcription-scroll-${callId}`}
          className="h-96 w-full border rounded-lg p-4"
        >
          {transcriptions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Volume2 className="w-8 h-8 mx-auto mb-2" />
                <p>No transcription available yet</p>
                {isActive && <p className="text-sm">Waiting for speech...</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {transcriptions.map((transcription) => (
                <div
                  key={transcription.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border"
                >
                  <div className="flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`${getSpeakerColor(transcription.speaker)} text-xs`}
                    >
                      {getSpeakerIcon(transcription.speaker)} {transcription.speaker.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{transcription.transcript}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{formatTimestamp(transcription.timestamp)}</span>
                      {transcription.confidence && (
                        <span>Confidence: {Math.round(transcription.confidence * 100)}%</span>
                      )}
                      {transcription.duration && (
                        <span>Duration: {transcription.duration}s</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {recording && recording.conversionStatus === 'processing' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-sm text-yellow-800">Converting recording to MP4...</span>
            </div>
          </div>
        )}

        {recording && recording.conversionStatus === 'failed' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-sm text-red-800">Recording conversion failed. Audio file may still be available.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}