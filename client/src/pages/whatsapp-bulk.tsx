import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageCircle, 
  Send, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Upload,
  Download,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react';
import { WhatsAppTemplatePreview } from '@/components/WhatsAppTemplatePreview';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  content: string;
  variables?: any;
  metaTemplateId?: string;
  components?: any[];
  metaTemplate?: any;
  createdAt: string;
}

interface BulkMessageJob {
  id: string;
  templateName: string;
  recipients: any[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  languageCode: string;
  createdAt: string;
  completedAt?: string;
}

export default function WhatsAppBulk() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipientsList, setRecipientsList] = useState('');
  const [languageCode, setLanguageCode] = useState('en_US');
  const [delayMs, setDelayMs] = useState(1000);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'UTILITY' as const,
    language: 'en_US',
    text: ''
  });

  // Fetch templates with refresh
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['/api/whatsapp/templates'],
    refetchOnWindowFocus: true,
  });

  // Sync templates mutation
  const syncTemplatesMutation = useMutation({
    mutationFn: () => apiRequest('/api/whatsapp/templates/sync', 'POST'),
    onSuccess: () => {
      toast({ title: 'Templates synced successfully' });
      refetchTemplates();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to sync templates', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Fetch template examples
  const { data: templateExamples = [] } = useQuery({
    queryKey: ['/api/whatsapp/templates/examples'],
  });

  // Fetch bulk jobs
  const { data: bulkJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/whatsapp/bulk/jobs'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: any) => 
      apiRequest('/api/whatsapp/templates', 'POST', templateData),
    onSuccess: () => {
      toast({ title: 'Template created and submitted for approval' });
      setNewTemplate({ name: '', category: 'UTILITY', language: 'en_US', text: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create template', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Send bulk messages mutation
  const sendBulkMutation = useMutation<any, Error, any>({
    mutationFn: async (bulkData: any) => {
      const response = await apiRequest('/api/whatsapp/bulk/send', 'POST', bulkData);
      return response;
    },
    onSuccess: (job: BulkMessageJob) => {
      toast({ 
        title: 'Bulk messaging job started',
        description: `Job ${job.id} created with ${job.totalMessages} messages`
      });
      setRecipientsList('');
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/bulk/jobs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to start bulk messaging', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Handle bulk message sending
  const handleSendBulk = () => {
    if (!selectedTemplate) {
      toast({ title: 'Please select a template', variant: 'destructive' });
      return;
    }

    if (!recipientsList.trim()) {
      toast({ title: 'Please enter recipient phone numbers', variant: 'destructive' });
      return;
    }

    // Parse recipients (one per line)
    const phoneNumbers = recipientsList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(phoneNumber => ({ phoneNumber }));

    if (phoneNumbers.length === 0) {
      toast({ title: 'No valid phone numbers found', variant: 'destructive' });
      return;
    }

    sendBulkMutation.mutate({
      templateName: selectedTemplate,
      recipients: phoneNumbers,
      languageCode,
      delayMs
    });
  };

  // Handle template creation
  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.text) {
      toast({ title: 'Please fill in template name and text', variant: 'destructive' });
      return;
    }

    const templateData = {
      name: newTemplate.name.toLowerCase().replace(/\s+/g, '_'),
      category: newTemplate.category,
      language: newTemplate.language,
      components: [
        {
          type: 'BODY',
          text: newTemplate.text
        }
      ]
    };

    createTemplateMutation.mutate(templateData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'REJECTED': return 'bg-red-500';
      case 'COMPLETED': return 'bg-green-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getJobProgress = (job: BulkMessageJob) => {
    if (job.totalMessages === 0) return 0;
    return Math.round(((job.sentMessages + job.failedMessages) / job.totalMessages) * 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Bulk Messaging</h1>
          <p className="text-muted-foreground">
            Manage templates and send bulk WhatsApp messages using Meta Business API
          </p>
        </div>
      </div>

      <Tabs defaultValue="bulk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Bulk Messaging
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Message Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Bulk Messages
              </CardTitle>
              <CardDescription>
                Send template messages to multiple recipients. Templates must be approved by Meta before use.
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => syncTemplatesMutation.mutate()}
                  disabled={syncTemplatesMutation.isPending}
                >
                  {syncTemplatesMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Templates
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchTemplates()}
                  disabled={templatesLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select template (${(templates as WhatsAppTemplate[]).filter(t => t.status === 'APPROVED').length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesLoading ? (
                        <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                      ) : (templates as WhatsAppTemplate[]).length === 0 ? (
                        <SelectItem value="none" disabled>No templates found - Click sync button</SelectItem>
                      ) : (templates as WhatsAppTemplate[])
                        .filter((t: WhatsAppTemplate) => t.status === 'APPROVED')
                        .map((template: WhatsAppTemplate) => (
                          <SelectItem key={template.id} value={template.name}>
                            {template.name} ({template.category}) - {template.status}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {(templates as WhatsAppTemplate[]).length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {(templates as WhatsAppTemplate[]).filter(t => t.status === 'APPROVED').length} approved templates available
                    </p>
                  )}
                  
                  {/* WhatsApp Template Preview */}
                  {selectedTemplate && (
                    <div className="mt-3">
                      {(() => {
                        const template = (templates as WhatsAppTemplate[]).find(t => t.name === selectedTemplate);
                        if (!template) return (
                          <div className="p-3 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Template not found</p>
                          </div>
                        );
                        
                        return <WhatsAppTemplatePreview template={template} />;
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={languageCode} onValueChange={setLanguageCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="en_GB">English (UK)</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients (one phone number per line)</Label>
                <Textarea
                  id="recipients"
                  placeholder={`+1234567890\n+0987654321\n+1122334455`}
                  value={recipientsList}
                  onChange={(e) => setRecipientsList(e.target.value)}
                  rows={8}
                />
                <p className="text-sm text-muted-foreground">
                  Enter phone numbers with country code, one per line. Example: +1234567890
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Delay between messages (ms)</Label>
                <Input
                  id="delay"
                  type="number"
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value) || 1000)}
                  min={100}
                  max={10000}
                />
                <p className="text-sm text-muted-foreground">
                  Delay between each message to avoid rate limiting (100-10000ms)
                </p>
              </div>

              <Button 
                onClick={handleSendBulk}
                disabled={sendBulkMutation.isPending}
                className="w-full"
              >
                {sendBulkMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Starting Bulk Job...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Bulk Messages
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Template
                </CardTitle>
                <CardDescription>
                  Create a new WhatsApp message template. Templates require Meta approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    placeholder="order_confirmation"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase letters, numbers, and underscores only
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newTemplate.category} 
                      onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTILITY">Utility</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateLang">Language</Label>
                    <Select 
                      value={newTemplate.language} 
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_US">English (US)</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateText">Template Text</Label>
                  <Textarea
                    id="templateText"
                    placeholder="Hello {{1}}! Your order #{{2}} has been confirmed."
                    value={newTemplate.text}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, text: e.target.value }))}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {`{{1}}, {{2}}`}, etc. for variables. Use *bold*, _italic_ for formatting.
                  </p>
                </div>

                <Button 
                  onClick={handleCreateTemplate}
                  disabled={createTemplateMutation.isPending}
                  className="w-full"
                >
                  {createTemplateMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Template...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Template Examples
                </CardTitle>
                <CardDescription>
                  Pre-built template examples you can use as reference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(templateExamples as any[]).map((example: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{example.name}</h4>
                      <Badge variant="outline">{example.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {example.components?.[0]?.text || 'No text content'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewTemplate({
                        name: example.name || '',
                        category: example.category || 'UTILITY',
                        language: example.language || 'en_US',
                        text: example.components?.[0]?.text || ''
                      })}
                    >
                      Use Template
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Templates</CardTitle>
              <CardDescription>
                Manage your WhatsApp message templates and their approval status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(templates as WhatsAppTemplate[]).map((template: WhatsAppTemplate) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.category}</TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(template.status)}>
                            {template.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(template.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bulk Message Jobs
              </CardTitle>
              <CardDescription>
                Monitor the status of your bulk messaging campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(bulkJobs as BulkMessageJob[]).map((job: BulkMessageJob) => (
                    <div key={job.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{job.templateName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Job ID: {job.id}
                          </p>
                        </div>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Messages</p>
                          <p className="font-medium">{job.totalMessages}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sent</p>
                          <p className="font-medium text-green-600">{job.sentMessages}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Failed</p>
                          <p className="font-medium text-red-600">{job.failedMessages}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{getJobProgress(job)}%</span>
                        </div>
                        <Progress value={getJobProgress(job)} className="h-2" />
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Started: {new Date(job.createdAt).toLocaleString()}</span>
                        {job.completedAt && (
                          <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {(bulkJobs as BulkMessageJob[]).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No bulk messaging jobs found. Start your first campaign from the Bulk Messaging tab.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}