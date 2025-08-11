# AI Calling Agent Platform

A comprehensive AI-powered calling platform that makes automated outbound calls using Twilio and conducts natural conversations with OpenAI. The system handles end-to-end call management, real-time monitoring, and intelligent data collection.

## Features

### 🤖 AI-Powered Conversations
- Natural, human-like conversations using OpenAI GPT-4o
- Context-aware responses based on campaign objectives
- Automatic data extraction from conversations
- Real-time AI performance monitoring

### 📞 Advanced Call Management
- Automated outbound calling via Twilio SIP trunk
- Real-time call status tracking
- Call recording and playback
- Webhook-based call flow control
- Live call monitoring dashboard

### 📊 Comprehensive Analytics
- Real-time dashboard with key metrics
- Success rate tracking
- AI response time monitoring
- Data collection analytics
- Campaign performance insights

### 🎯 Campaign Management
- Flexible campaign creation with custom AI prompts
- Contact database management
- Automated contact creation from conversations
- Multi-campaign support

### 🔄 Real-time Updates
- WebSocket integration for live updates
- Active call monitoring
- Real-time status changes
- Live conversation tracking

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **TanStack Query** for state management
- **Wouter** for routing
- **WebSocket** for real-time updates

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **WebSocket Server** for real-time communication
- **RESTful API** design

### External Services
- **OpenAI GPT-4o** for AI conversations
- **Twilio** for telephony services
- **Neon Database** for PostgreSQL hosting

## Getting Started

### Prerequisites
1. **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Twilio Account** - Sign up at [Twilio Console](https://console.twilio.com/)
   - Account SID
   - Auth Token
   - Phone Number (for outbound calls)

### Installation
1. The application is already set up and running on Replit
2. All dependencies are installed
3. Database is configured and seeded with sample data

### Configuration
The following environment variables are required and already configured:
- `OPENAI_API_KEY` - Your OpenAI API key
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)

## Usage

### Making Test Calls
1. Open the dashboard
2. Use the "Quick Call" panel on the right
3. Enter a phone number and select a campaign
4. Click "Start Call" to initiate

**Note**: For testing purposes, you can use Twilio test numbers or your own verified numbers.

### Campaign Management
The system comes with 3 pre-configured campaigns:
1. **Customer Survey** - Collect customer feedback
2. **Lead Generation** - Identify potential customers
3. **Appointment Scheduling** - Schedule service consultations

### Monitoring Calls
- **Active Calls**: Monitor ongoing conversations in real-time
- **Call History**: Review completed calls and performance
- **AI Performance**: Track response times and accuracy
- **System Status**: Monitor service health

## API Endpoints

### Calls
- `GET /api/calls` - List all calls
- `GET /api/calls/active` - Get active calls
- `GET /api/calls/recent` - Get recent calls
- `POST /api/calls/initiate` - Start a new call
- `POST /api/calls/:id/end` - End a call

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/system/status` - Get system status

### Webhooks (Twilio)
- `POST /api/twilio/voice` - Handle incoming call
- `POST /api/twilio/gather` - Process speech input
- `POST /api/twilio/status` - Handle call status updates

## Architecture

### Database Schema
- **users** - User accounts and authentication
- **contacts** - Contact information and details
- **campaigns** - Campaign definitions and AI prompts
- **calls** - Call records and metadata
- **call_messages** - Conversation history

### Real-time Communication
- WebSocket server broadcasts live updates
- Call status changes propagated instantly
- Real-time dashboard metrics
- Live conversation monitoring

### AI Integration
- OpenAI GPT-4o for natural conversations
- Structured JSON responses for data extraction
- Context-aware conversation management
- Performance metrics tracking

### Call Flow
1. **Initiation**: Call created via API
2. **Connection**: Twilio places outbound call
3. **Conversation**: AI handles speech-to-text and responses
4. **Data Collection**: Information extracted during conversation
5. **Completion**: Call ended with summary and analytics

## Development

### Running Locally
The application is already running on Replit. To run locally:
```bash
npm run dev
```

### Database Management
```bash
# Push schema changes
npm run db:push

# Reset database (if needed)
npm run db:reset
```

### Testing
- Use the Quick Call feature with test phone numbers
- Monitor real-time updates in the dashboard
- Check call history and analytics
- Test different campaign types

## Troubleshooting

### Common Issues
1. **Call not connecting**: Verify Twilio credentials and phone number format
2. **AI not responding**: Check OpenAI API key and quota
3. **Database errors**: Verify DATABASE_URL connection
4. **Webhooks failing**: Ensure Replit domain is accessible

### Support
- Check system status in the sidebar
- Monitor console logs for detailed error information
- Verify all environment variables are set correctly

## License

This project is built for demonstration purposes and includes integrations with external services that may have their own terms and pricing.