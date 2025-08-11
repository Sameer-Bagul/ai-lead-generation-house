import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";

export default function Settings() {
  const [settings, setSettings] = useState({
    twilioPhoneNumber: "",
    openaiModel: "gpt-4o",
    maxCallDuration: 300,
    autoRecording: true,
    webhookUrl: "",
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    voiceConfig: "",
    transcriberConfig: "",
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    accessToken: "",
    businessAccountId: "",
    phoneNumberId: "",
    verifyToken: "",
  });

  const [voiceConfigFile, setVoiceConfigFile] = useState<File | null>(null);
  const [transcriberConfigFile, setTranscriberConfigFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system status
  const { data: systemStatus } = useQuery<{
    database: string;
    twilio: string;
    openai: string;
    whatsapp: string;
    timestamp: string;
  }>({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000,
  });

  // Fetch WhatsApp status
  const { data: whatsappStatus } = useQuery<{
    configured: boolean;
    connected: boolean;
    phoneNumber?: string;
    businessAccount?: string;
  }>({
    queryKey: ['/api/whatsapp/status'],
    refetchInterval: 30000,
  });

  const handleSave = async () => {
    try {
      // Save configuration files if uploaded
      if (voiceConfigFile) {
        const formData = new FormData();
        formData.append('voiceConfig', voiceConfigFile);
        await fetch('/api/config/voice', {
          method: 'POST',
          body: formData,
        });
      }

      if (transcriberConfigFile) {
        const formData = new FormData();
        formData.append('transcriberConfig', transcriberConfigFile);
        await fetch('/api/config/transcriber', {
          method: 'POST',
          body: formData,
        });
      }

      // Save other settings
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const testConnection = (service: string) => {
    toast({
      title: `Testing ${service} connection...`,
      description: "Please wait while we verify the connection.",
    });
    
    // Simulate test delay
    setTimeout(() => {
      toast({
        title: `${service} connection successful`,
        description: "All services are working correctly.",
      });
    }, 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* <Sidebar /> */}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
              <p className="text-gray-600 mt-1">Configure your AI calling platform</p>
            </div>
            <Button onClick={handleSave} className="bg-primary text-white hover:bg-blue-700">
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* AI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Configure OpenAI models and voice settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="openai-model">OpenAI Model</Label>
                    <Select
                      value={settings.openaiModel}
                      onValueChange={(value) => setSettings({ ...settings, openaiModel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select OpenAI model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-duration">Max Call Duration (seconds)</Label>
                    <Input
                      id="max-duration"
                      type="number"
                      value={settings.maxCallDuration}
                      onChange={(e) => setSettings({ ...settings, maxCallDuration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Open Source Voice Configuration</Label>
                    <FileUpload
                      onFileSelect={setVoiceConfigFile}
                      accept=".json,.yaml,.yml,.config"
                      className="mt-2"
                    >
                      Upload Voice Config File
                    </FileUpload>
                    {voiceConfigFile && (
                      <p className="text-sm text-gray-600 mt-1">Selected: {voiceConfigFile.name}</p>
                    )}
                  </div>

                  <div>
                    <Label>Open Source Transcriber Configuration</Label>
                    <FileUpload
                      onFileSelect={setTranscriberConfigFile}
                      accept=".json,.yaml,.yml,.config"
                      className="mt-2"
                    >
                      Upload Transcriber Config File
                    </FileUpload>
                    {transcriberConfigFile && (
                      <p className="text-sm text-gray-600 mt-1">Selected: {transcriberConfigFile.name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Monitor system health and connectivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${systemStatus?.database === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">Database</span>
                    </div>
                    <span className={`text-sm ${systemStatus?.database === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus?.database || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${systemStatus?.twilio === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">Twilio</span>
                    </div>
                    <span className={`text-sm ${systemStatus?.twilio === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus?.twilio || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${systemStatus?.openai === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">OpenAI</span>
                    </div>
                    <span className={`text-sm ${systemStatus?.openai === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus?.openai || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messaging Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp & Email Integration</CardTitle>
                <CardDescription>Configure real-time messaging during calls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="whatsapp-enabled">Enable WhatsApp Messaging</Label>
                      <p className="text-sm text-gray-500">Send messages when WhatsApp numbers are captured</p>
                    </div>
                    <Switch
                      id="whatsapp-enabled"
                      checked={settings.notificationsEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-enabled">Enable Email Messaging</Label>
                      <p className="text-sm text-gray-500">Send emails when addresses are captured</p>
                    </div>
                    <Switch
                      id="email-enabled"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications about call events</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotif">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email alerts for important events</p>
                  </div>
                  <Switch
                    id="emailNotif"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotif">SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Send SMS alerts for critical events</p>
                  </div>
                  <Switch
                    id="smsNotif"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}