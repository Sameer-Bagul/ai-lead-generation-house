import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Upload, Mic, MessageSquare, Bot, Globe, Volume2, FileAudio, Languages } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { useMutation } from "@tanstack/react-query";

// Removed IndicTTSConfig - using only ElevenLabs

interface WhisperConfig {
  model: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';
  language?: string;
  task: 'transcribe' | 'translate';
  outputFormat: 'txt' | 'json' | 'srt' | 'vtt';
  temperature: number;
  beamSize: number;
  patience: number;
}

interface SystemSettings {
  openaiModel: string;
  whisper: WhisperConfig;
  messaging: {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    autoResponse: boolean;
  };
  calling: {
    maxConcurrentCalls: number;
    callTimeout: number;
    recordCalls: boolean;
  };
}

export default function EnhancedSettings() {
  const { toast } = useToast();
  
  const [testWhatsAppData, setTestWhatsAppData] = useState({
    phoneNumber: '',
    message: 'Hello from AI Calling Agent!'
  });
  
  const [settings, setSettings] = useState<SystemSettings>({
    openaiModel: "gpt-4o",
    whisper: {
      model: "base",
      task: "transcribe",
      outputFormat: "json",
      temperature: 0.0,
      beamSize: 5,
      patience: 1.0
    },
    messaging: {
      whatsappEnabled: true,
      emailEnabled: true,
      autoResponse: false
    },
    calling: {
      maxConcurrentCalls: 5,
      callTimeout: 300,
      recordCalls: true
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved successfully",
        description: "Your configuration has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // File upload mutations
  const uploadVoiceConfigMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('voiceConfig', file);
      const response = await fetch('/api/config/voice', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload voice config');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice configuration uploaded",
        description: "Voice configuration has been updated.",
      });
    },
  });

  const uploadTranscriberConfigMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('transcriberConfig', file);
      const response = await fetch('/api/config/transcriber', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload transcriber config');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transcriber configuration uploaded",
        description: "Whisper configuration has been updated.",
      });
    },
  });

  // WhatsApp test mutation
  const testWhatsAppMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const response = await fetch('/api/test/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send WhatsApp message');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "WhatsApp message sent!" : "Message failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error sending WhatsApp message",
        description: "Please check your Meta WhatsApp credentials.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleTestWhatsApp = () => {
    testWhatsAppMutation.mutate(testWhatsAppData);
  };

  // Removed indicLanguages - using only ElevenLabs now

  const whisperLanguages = [
    { code: 'auto', name: 'Auto-detect' },
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ur', name: 'Urdu' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* <Sidebar /> */}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Advanced Settings</h2>
              <p className="text-gray-600 mt-1">Configure AI models, voice synthesis, and transcription</p>
            </div>
            <Button 
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="ai-models" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="ai-models">
                  <Bot className="mr-2 h-4 w-4" />
                  AI Models
                </TabsTrigger>
                <TabsTrigger value="voice-synthesis">
                  <Volume2 className="mr-2 h-4 w-4" />
                  Voice Synthesis
                </TabsTrigger>
                <TabsTrigger value="transcription">
                  <FileAudio className="mr-2 h-4 w-4" />
                  Transcription
                </TabsTrigger>
                <TabsTrigger value="messaging">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messaging
                </TabsTrigger>
                <TabsTrigger value="calling">
                  <Mic className="mr-2 h-4 w-4" />
                  Calling
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai-models" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>OpenAI Configuration</CardTitle>
                    <CardDescription>
                      Configure the AI model for conversation generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openai-model">Default OpenAI Model</Label>
                        <Select
                          value={settings.openaiModel}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            openaiModel: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="voice-synthesis" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Volume2 className="mr-2 h-5 w-5" />
                      Voice Synthesis Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure ElevenLabs premium voice synthesis for natural-sounding calls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Volume2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">ElevenLabs Voice Synthesis</h3>
                      <p className="text-gray-600 mb-4">
                        Voice synthesis is now configured per campaign in the Campaigns section.
                        Each campaign can use a different ElevenLabs voice configuration.
                      </p>
                      <Button variant="outline" onClick={() => window.location.href = '/campaigns'}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure in Campaigns
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcription" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mic className="mr-2 h-5 w-5" />
                      OpenAI Whisper Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure speech recognition and transcription using OpenAI Whisper
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="whisper-model">Whisper Model</Label>
                        <Select
                          value={settings.whisper.model}
                          onValueChange={(value: any) => setSettings({
                            ...settings,
                            whisper: { ...settings.whisper, model: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tiny">Tiny (~39MB) - Fastest</SelectItem>
                            <SelectItem value="base">Base (~74MB) - Balanced</SelectItem>
                            <SelectItem value="small">Small (~244MB) - Better accuracy</SelectItem>
                            <SelectItem value="medium">Medium (~769MB) - High accuracy</SelectItem>
                            <SelectItem value="large">Large (~1550MB) - Highest accuracy</SelectItem>
                            <SelectItem value="large-v2">Large-v2 (~1550MB) - Latest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="whisper-language">Language</Label>
                        <Select
                          value={settings.whisper.language || 'auto'}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            whisper: { ...settings.whisper, language: value === 'auto' ? undefined : value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {whisperLanguages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="whisper-task">Task</Label>
                        <Select
                          value={settings.whisper.task}
                          onValueChange={(value: any) => setSettings({
                            ...settings,
                            whisper: { ...settings.whisper, task: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transcribe">Transcribe</SelectItem>
                            <SelectItem value="translate">Translate to English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Temperature: {settings.whisper.temperature}</Label>
                        <Slider
                          value={[settings.whisper.temperature]}
                          onValueChange={([value]) => setSettings({
                            ...settings,
                            whisper: { ...settings.whisper, temperature: value }
                          })}
                          min={0}
                          max={1}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Beam Size: {settings.whisper.beamSize}</Label>
                        <Slider
                          value={[settings.whisper.beamSize]}
                          onValueChange={([value]) => setSettings({
                            ...settings,
                            whisper: { ...settings.whisper, beamSize: value }
                          })}
                          min={1}
                          max={10}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Upload Whisper Configuration</Label>
                      <FileUpload
                        onFileSelect={(file) => uploadTranscriberConfigMutation.mutate(file)}
                        accept=".json,.yaml,.yml"
                        maxSize={5 * 1024 * 1024}
                        className="mt-2"
                        disabled={uploadTranscriberConfigMutation.isPending}
                      >
                        Upload Whisper Config File
                      </FileUpload>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messaging" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Messaging Integration</CardTitle>
                    <CardDescription>
                      Configure WhatsApp and Email messaging during calls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>WhatsApp Messaging</Label>
                          <p className="text-sm text-gray-500">Send WhatsApp messages when contact data is captured</p>
                        </div>
                        <Switch
                          checked={settings.messaging.whatsappEnabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            messaging: { ...settings.messaging, whatsappEnabled: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Email Messaging</Label>
                          <p className="text-sm text-gray-500">Send emails when contact data is captured</p>
                        </div>
                        <Switch
                          checked={settings.messaging.emailEnabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            messaging: { ...settings.messaging, emailEnabled: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Response</Label>
                          <p className="text-sm text-gray-500">Automatically respond to incoming messages</p>
                        </div>
                        <Switch
                          checked={settings.messaging.autoResponse}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            messaging: { ...settings.messaging, autoResponse: checked }
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>WhatsApp Test</CardTitle>
                    <CardDescription>
                      Test your Meta WhatsApp Business API integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="test-phone">Phone Number</Label>
                        <Input
                          id="test-phone"
                          placeholder="+1234567890"
                          value={testWhatsAppData.phoneNumber}
                          onChange={(e) => setTestWhatsAppData({
                            ...testWhatsAppData,
                            phoneNumber: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="test-message">Test Message</Label>
                        <Input
                          id="test-message"
                          placeholder="Hello from AI Calling Agent!"
                          value={testWhatsAppData.message}
                          onChange={(e) => setTestWhatsAppData({
                            ...testWhatsAppData,
                            message: e.target.value
                          })}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleTestWhatsApp}
                      disabled={testWhatsAppMutation.isPending || !testWhatsAppData.phoneNumber || !testWhatsAppData.message}
                      className="w-full"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {testWhatsAppMutation.isPending ? "Sending..." : "Send Test WhatsApp Message"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calling" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Calling Configuration</CardTitle>
                    <CardDescription>
                      Configure call handling and recording settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-calls">Max Concurrent Calls</Label>
                        <Input
                          id="max-calls"
                          type="number"
                          value={settings.calling.maxConcurrentCalls}
                          onChange={(e) => setSettings({
                            ...settings,
                            calling: { ...settings.calling, maxConcurrentCalls: parseInt(e.target.value) }
                          })}
                          min={1}
                          max={50}
                        />
                      </div>

                      <div>
                        <Label htmlFor="call-timeout">Call Timeout (seconds)</Label>
                        <Input
                          id="call-timeout"
                          type="number"
                          value={settings.calling.callTimeout}
                          onChange={(e) => setSettings({
                            ...settings,
                            calling: { ...settings.calling, callTimeout: parseInt(e.target.value) }
                          })}
                          min={30}
                          max={1800}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Call Recording</Label>
                        <p className="text-sm text-gray-500">Record all calls for quality and training purposes</p>
                      </div>
                      <Switch
                        checked={settings.calling.recordCalls}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          calling: { ...settings.calling, recordCalls: checked }
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}