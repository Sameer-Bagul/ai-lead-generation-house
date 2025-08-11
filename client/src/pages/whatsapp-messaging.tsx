import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Check, 
  CheckCheck, 
  MessageCircle, 
  Phone, 
  Clock, 
  Users, 
  Search,
  ChevronRight,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@shared/schema";

interface WhatsAppMessage {
  id: string;
  contactId: string;
  phone: string;
  message: string;
  messageType: 'text' | 'image' | 'document';
  direction: 'outbound' | 'inbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsappMessageId?: string;
  templateName?: string;
  campaignId?: string;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  failedReason?: string;
}

interface ChatSummary {
  contactId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  status: string;
  direction: string;
  unreadCount: number;
}

export default function WhatsAppMessaging() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch WhatsApp chats grouped by contact
  const { data: chats = [], isLoading: chatsLoading } = useQuery<ChatSummary[]>({
    queryKey: ['/api/whatsapp/chats'],
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts/enhanced'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch messages for selected contact
  const { data: messages = [], isLoading: messagesLoading } = useQuery<WhatsAppMessage[]>({
    queryKey: ['/api/whatsapp/messages', selectedContact?.id],
    enabled: !!selectedContact,
    refetchInterval: 2000, // Auto-refresh messages every 2 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { contactId: string; phone: string; message: string }) => 
      apiRequest("POST", "/api/whatsapp/messages", messageData),
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Your WhatsApp message has been sent successfully.",
      });
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/messages', selectedContact?.id] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "There was an error sending your WhatsApp message.",
        variant: "destructive",
      });
    }
  });

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle sending message
  const handleSendMessage = () => {
    if (!selectedContact || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      contactId: selectedContact.id,
      phone: selectedContact.phone,
      message: newMessage.trim()
    });
  };

  // Handle contact selection for messaging
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setSelectedChat(contact.id);
    setActiveTab("chat");
  };

  // Handle chat selection
  const handleChatSelect = (chat: ChatSummary) => {
    const contact = contacts.find(c => c.id === chat.contactId);
    if (contact) {
      setSelectedContact(contact);
      setSelectedChat(chat.contactId);
    }
  };

  // Message status icon renderer
  const getStatusIcon = (status: string, direction: string) => {
    if (direction === 'inbound') return null;
    
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <div className="h-3 w-3 rounded-full bg-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return formatTime(timestamp);
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (chatsLoading || contactsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading WhatsApp data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WhatsApp Messaging</h1>
        <p className="text-muted-foreground">Send and manage WhatsApp messages with status tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Chats and Contacts */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chats" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chats
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    New
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Existing Chats Tab */}
                <TabsContent value="chats" className="m-0">
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-1 p-4">
                      {chats.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No active chats yet. Start a new conversation in the "New" tab.
                        </div>
                      ) : (
                        chats.map((chat) => (
                          <div
                            key={chat.contactId}
                            className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedChat === chat.contactId ? 'bg-muted' : ''
                            }`}
                            onClick={() => handleChatSelect(chat)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{chat.contactName}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {chat.lastMessage}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(chat.lastMessageTime)}
                                </span>
                                {chat.unreadCount > 0 && (
                                  <Badge variant="default" className="h-5 min-w-[20px] text-xs">
                                    {chat.unreadCount}
                                  </Badge>
                                )}
                                {getStatusIcon(chat.status, chat.direction)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* New Contact Tab */}
                <TabsContent value="contacts" className="m-0">
                  <div className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="space-y-1 px-4">
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedContact?.id === contact.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleContactSelect(contact)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{contact.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.phone} • {contact.city}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Chat Window */}
        <div className="lg:col-span-3">
          {selectedContact ? (
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedContact.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedContact.phone} • {selectedContact.company}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-400px)] p-4">
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="text-center text-muted-foreground">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.direction === 'outbound'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className={`flex items-center gap-2 mt-2 ${
                              message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className={`text-xs ${
                                message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.createdAt)}
                              </span>
                              {message.direction === 'outbound' && (
                                <div className="flex items-center">
                                  {getStatusIcon(message.status, message.direction)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Type your WhatsApp message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[44px] max-h-32 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="self-end"
                  >
                    {sendMessageMutation.isPending ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose from existing chats or select a contact to start messaging
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}