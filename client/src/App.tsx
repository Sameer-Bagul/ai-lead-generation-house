import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import "@/styles/palette-vars.css";
import ContactCampaigns from "@/pages/contact-campaigns";
import CampaignDashboard from "@/pages/campaign-dashboard";
import CampaignManager from "@/pages/campaign-manager";
import SettingsPage from "@/pages/settings";
import EnhancedSettings from "@/pages/enhanced-settings";
import WhatsAppBulk from "@/pages/whatsapp-bulk";
import LiveCallsPage from "@/pages/live-calls";
import CallsAnalytics from "@/pages/calls-analytics";
import CampaignTimingAnalytics from "@/pages/campaign-timing-analytics";
import WhatsAppChats from "@/pages/whatsapp-chats";
import WhatsAppMessaging from "@/pages/whatsapp-messaging";
import NotFound from "@/pages/not-found";
// ...existing code...

function Router() {
  return (
    <div className="flex h-screen palette-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={ContactCampaigns} />
            <Route path="/campaign-dashboard" component={CampaignDashboard} />
            <Route path="/whatsapp-bulk" component={WhatsAppBulk} />
            <Route path="/live-calls" component={LiveCallsPage} />
            <Route path="/calls-analytics" component={CallsAnalytics} />
            <Route path="/campaign-timing" component={CampaignTimingAnalytics} />
            <Route path="/campaign-manager" component={CampaignManager} />
            <Route path="/contact-campaigns" component={ContactCampaigns} />
            <Route path="/whatsapp-chats" component={WhatsAppChats} />
            <Route path="/whatsapp-messaging" component={WhatsAppMessaging} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/enhanced-settings" component={EnhancedSettings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;

    // Removed Navigation function and sidebar code
