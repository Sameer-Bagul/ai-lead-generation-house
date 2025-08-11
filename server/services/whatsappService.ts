import { storage } from "../storage";

export interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(accessToken?: string, phoneNumberId?: string) {
    this.accessToken = accessToken || process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.phoneNumberId =
      phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  }

  // Get WABA ID from environment variable
  private async getWABAId(): Promise<string> {
    const wabaId = process.env.WHATSAPP_WABA_ID;

    if (!wabaId) {
      throw new Error("WHATSAPP_WABA_ID environment variable not configured");
    }

    console.log("📋 Using WABA ID from environment:", wabaId);
    return wabaId;
  }

  // Fetch approved message templates from Meta Business API
  async fetchApprovedTemplates(): Promise<any[]> {
    try {
      console.log("🔄 Fetching approved templates from Meta Business API...");

      if (!this.accessToken || !this.phoneNumberId) {
        console.log("❌ WhatsApp credentials not configured");
        return [];
      }

      const wabaId = await this.getWABAId();
      console.log("📋 WABA ID:", wabaId);

      const url = `${this.baseUrl}/${wabaId}/message_templates?fields=name,status,category,components,language,id&limit=50`;
      console.log("📋 Requesting URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();
      console.log("📋 Meta API response status:", response.status);
      console.log("📋 Meta API response:", responseText);

      if (!response.ok) {
        console.error("❌ Meta API error response:", responseText);
        throw new Error(`Failed to fetch templates: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log("📋 Parsed Meta API data:", JSON.stringify(data, null, 2));

      const templates = data.data || [];
      console.log(
        `📋 Found ${templates.length} templates from Meta Business API`,
      );

      // Filter only approved templates and preserve EXACT Meta Business API structure
      const approvedTemplates = templates
        .filter((template: any) => template.status === "APPROVED")
        .map((template: any) => {
          console.log(
            `📋 Preserving complete Meta template structure for ${template.name}:`,
            template,
          );

          // Return template exactly as received from Meta Business API - NO transformation
          return {
            ...template, // Preserve ALL fields exactly as received from Meta
            // Only add a timestamp for our internal tracking
            _fetchedAt: new Date().toISOString(),
          };
        });

      console.log(
        `✅ Processed ${approvedTemplates.length} approved templates`,
      );
      return approvedTemplates;
    } catch (error) {
      console.error("❌ Error fetching templates from Meta:", error);
      return [];
    }
  }

  // Send a WhatsApp message via Meta Business API
  async sendMessage(message: WhatsAppMessage): Promise<any> {
    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error("WhatsApp credentials not configured");
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    return await response.json();
  }

  // Clean phone number for WhatsApp (remove + and any non-digits)
  private cleanPhoneNumber(phone: string): string {
    // Remove + sign and any non-digit characters
    const cleaned = phone.replace(/\+/g, "").replace(/\D/g, "");
    console.log(`📱 Phone number cleaned: ${phone} → ${cleaned}`);
    return cleaned;
  }

  // Send a text message
  async sendTextMessage(to: string, message: string): Promise<any> {
    const cleanedPhoneNumber = this.cleanPhoneNumber(to);

    const whatsappMessage: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: cleanedPhoneNumber,
      type: "text",
      text: {
        body: message,
      },
    };

    console.log(
      `📱 Sending WhatsApp message to ${cleanedPhoneNumber}: ${message.substring(0, 50)}...`,
    );
    return await this.sendMessage(whatsappMessage);
  }

  // Send a template message using Meta Business API template endpoint (required for campaigns and 24+ hour rule)
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en_US",
    parameters?: string[],
  ): Promise<any> {
    const cleanedPhoneNumber = this.cleanPhoneNumber(to);

    // Construct Meta Business API template message payload
    const whatsappMessage: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: cleanedPhoneNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: parameters && parameters.length > 0 ? String(parameters[0]) : "User",
                parameter_name: "name"
              }
            ]
          }
        ]
      },
    };

    console.log(
      `📱 Meta Business API: Sending template "${templateName}" to ${cleanedPhoneNumber}`,
    );
    console.log(
      "📋 Template API payload:",
      JSON.stringify(whatsappMessage, null, 2),
    );

    // Call Meta Business API template endpoint
    const response = await this.sendMessage(whatsappMessage);

    if (response.messages && response.messages[0]) {
      console.log(
        `✅ Meta Business API template sent successfully: ${response.messages[0].id}`,
      );
    }

    return response;
  }

  // Process incoming webhook from WhatsApp
  async processWebhook(body: any): Promise<void> {
    console.log("📨 WhatsApp webhook received:", JSON.stringify(body, null, 2));

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            await this.processMessage(change.value);
          }
        }
      }
    }
  }

  // Process incoming messages and status updates
  private async processMessage(value: any): Promise<void> {
    // Process incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.handleIncomingMessage(message, value.contacts?.[0]);
      }
    }

    // Process message status updates (delivery, read receipts)
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.handleStatusUpdate(status);
      }
    }
  }

  // Handle incoming message from customer
  private async handleIncomingMessage(
    message: any,
    contact: any,
  ): Promise<void> {
    try {
      console.log("📥 Processing incoming message:", message.id);

      // Extract message content
      let messageText = "";
      if (message.type === "text") {
        messageText = message.text.body;
      } else if (message.type === "image") {
        messageText = `[Image] ${message.image?.caption || ""}`;
      } else if (message.type === "document") {
        messageText = `[Document] ${message.document?.filename || ""}`;
      } else {
        messageText = `[${message.type}] Unsupported message type`;
      }

      // Find or create contact
      let existingContact = await storage.getContactByPhone(message.from);
      if (!existingContact && contact) {
        // Create new contact from WhatsApp contact info
        existingContact = await storage.createContact({
          name:
            contact.profile?.name || `WhatsApp User ${message.from.slice(-4)}`,
          phone: message.from,
          whatsappNumber: message.from,
          notes: "Created from WhatsApp message",
        });
      }

      if (existingContact) {
        // Store incoming message
        await storage.createWhatsAppMessage({
          contactId: existingContact.id,
          phone: message.from,
          message: messageText,
          messageType: message.type,
          direction: "inbound",
          status: "received",
          whatsappMessageId: message.id,
        });

        console.log(
          "✅ Incoming message stored for contact:",
          existingContact.name,
        );
      } else {
        console.error(
          "❌ Could not find or create contact for phone:",
          message.from,
        );
      }
    } catch (error) {
      console.error("❌ Error processing incoming message:", error);
    }
  }

  // Handle message status updates (delivered, read, failed)
  private async handleStatusUpdate(status: any): Promise<void> {
    try {
      console.log("📊 Processing status update:", status.id, status.status);

      // Find message by WhatsApp message ID
      const messages = await storage.getWhatsAppMessageByWhatsAppId(status.id);
      if (messages.length > 0) {
        const message = messages[0];

        // Update message status
        const updateData: any = { status: status.status };

        if (status.status === "delivered" && status.timestamp) {
          updateData.deliveredAt = new Date(parseInt(status.timestamp) * 1000);
        } else if (status.status === "read" && status.timestamp) {
          updateData.readAt = new Date(parseInt(status.timestamp) * 1000);
        } else if (status.status === "failed") {
          updateData.failedReason =
            status.errors?.[0]?.title || "Message failed to send";
        }

        await storage.updateWhatsAppMessage(message.id, updateData);
        console.log("✅ Message status updated:", message.id, status.status);
      } else {
        console.log("⚠️ No message found for status update:", status.id);
      }
    } catch (error) {
      console.error("❌ Error processing status update:", error);
    }
  }

  // Verify webhook signature (optional security measure)
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Implementation would use HMAC-SHA256 with app secret
    // For now, we'll skip signature verification
    return true;
  }

  // Diagnostic function to check why messages aren't being received
  async diagnosePossibleDeliveryIssues(phoneNumber?: string): Promise<any> {
    try {
      const diagnostics: any = {
        timestamp: new Date().toISOString(),
        businessAccount: {},
        phoneNumberValidation: {},
        recentMessageStats: {},
        recommendations: [],
      };

      // 1. Check business account quality rating
      try {
        const wabaId = await this.getWABAId();
        const accountUrl = `${this.baseUrl}/${wabaId}?fields=account_review_status,business_verification_status,messaging_limit_tier`;
        const accountResponse = await fetch(accountUrl, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (accountResponse.ok) {
          diagnostics.businessAccount = await accountResponse.json();

          if (
            diagnostics.businessAccount.account_review_status !== "APPROVED"
          ) {
            diagnostics.recommendations.push(
              "❌ Business account not approved - this can cause delivery issues",
            );
          }
          if (
            diagnostics.businessAccount.business_verification_status !==
            "verified"
          ) {
            diagnostics.recommendations.push(
              "⚠️ Business not verified - consider completing business verification",
            );
          }
        }
      } catch (error) {
        diagnostics.businessAccount.error =
          "Could not fetch business account info";
      }

      // 2. Phone number validation
      if (phoneNumber) {
        const cleaned = this.cleanPhoneNumber(phoneNumber);
        diagnostics.phoneNumberValidation = {
          original: phoneNumber,
          cleaned: cleaned,
          isValid: this.validatePhoneNumber(cleaned),
          length: cleaned.length,
          startsWithCountryCode: cleaned.length >= 10,
        };

        if (!this.validatePhoneNumber(cleaned)) {
          diagnostics.recommendations.push(
            `❌ Phone number ${phoneNumber} may be invalid - ensure it includes country code`,
          );
        }
      }

      // 3. Check recent message patterns from database
      try {
        const recentMessages = await storage.getWhatsAppMessages();
        const last24Hours = recentMessages.filter((msg) => {
          const msgTime = new Date(msg.createdAt);
          const now = new Date();
          return now.getTime() - msgTime.getTime() < 24 * 60 * 60 * 1000;
        });

        const outboundMessages = last24Hours.filter(
          (msg) => msg.direction === "outbound",
        );
        const deliveredMessages = outboundMessages.filter(
          (msg) => msg.status === "delivered",
        );
        const failedMessages = outboundMessages.filter(
          (msg) => msg.status === "failed",
        );
        const sentMessages = outboundMessages.filter(
          (msg) => msg.status === "sent",
        );

        diagnostics.recentMessageStats = {
          totalOutbound: outboundMessages.length,
          delivered: deliveredMessages.length,
          failed: failedMessages.length,
          sent: sentMessages.length,
          deliveryRate:
            outboundMessages.length > 0
              ? (
                  (deliveredMessages.length / outboundMessages.length) *
                  100
                ).toFixed(1) + "%"
              : "0%",
        };

        // Analyze patterns
        if (failedMessages.length > deliveredMessages.length) {
          diagnostics.recommendations.push(
            "❌ High failure rate detected - check phone number formats and templates",
          );
        }
        if (outboundMessages.length > 50) {
          diagnostics.recommendations.push(
            "⚠️ High message volume in 24h - you may be hitting rate limits",
          );
        }
        if (sentMessages.length > 10) {
          diagnostics.recommendations.push(
            '⚠️ Many messages stuck in "sent" status - possible delivery delays',
          );
        }
      } catch (error) {
        diagnostics.recentMessageStats.error =
          "Could not analyze recent messages";
      }

      // 4. General recommendations
      diagnostics.recommendations.push(
        "✅ Use approved templates for new conversations (24-hour rule)",
        "✅ Ensure phone numbers include country codes",
        "✅ Monitor message quality rating in Meta Business Manager",
        "✅ Avoid sending identical messages to many recipients quickly",
      );

      return diagnostics;
    } catch (error) {
      console.error("❌ Error running WhatsApp diagnostics:", error);
      return {
        error: "Failed to run diagnostics",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Validate phone number format
  private validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation - should be 10-15 digits
    const cleaned = phoneNumber.replace(/\D/g, "");
    return (
      cleaned.length >= 10 && cleaned.length <= 15 && /^\d+$/.test(cleaned)
    );
  }

  // Enhanced message sending with better error handling
  async sendMessageWithDiagnostics(message: WhatsAppMessage): Promise<any> {
    try {
      const result = await this.sendMessage(message);
      console.log("✅ WhatsApp message sent successfully:", result);
      return { success: true, ...result };
    } catch (error) {
      console.error("❌ WhatsApp message failed:", error);

      // Try to extract meaningful error information
      let errorDetails = "Unknown error";
      if (error instanceof Error) {
        try {
          const errorObj = JSON.parse(
            error.message.replace("WhatsApp API error: ", ""),
          );
          errorDetails = errorObj.error?.message || error.message;
        } catch {
          errorDetails = error.message;
        }
      }

      return {
        success: false,
        error: errorDetails,
        recommendations: await this.getErrorRecommendations(errorDetails),
      };
    }
  }

  // Get recommendations based on error message
  private async getErrorRecommendations(
    errorMessage: string,
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (errorMessage.includes("invalid phone number")) {
      recommendations.push(
        "Ensure phone number includes country code (e.g., +1234567890)",
      );
    }
    if (errorMessage.includes("template")) {
      recommendations.push("Use approved templates for new conversations");
    }
    if (errorMessage.includes("rate limit")) {
      recommendations.push(
        "Reduce message sending frequency - you may be hitting rate limits",
      );
    }
    if (errorMessage.includes("quality")) {
      recommendations.push(
        "Check your business account quality rating in Meta Business Manager",
      );
    }

    return recommendations;
  }
}

export const whatsappService = new WhatsAppService();
