# WhatsApp Messaging Platform

## Overview
This project is an AI-powered communication platform designed for pathology lab partnerships, integrating AI calling capabilities with WhatsApp bulk messaging. The system serves as a dual-channel outreach solution to foster transparency and connect people seeking tests with laboratories, operating on a zero-commission model. Key capabilities include an AI calling agent with a defined conversational flow, robust WhatsApp messaging for campaign management, and authenticated call recording downloads from Twilio.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Shadcn/ui components (based on Radix UI) with Tailwind CSS for styling. TanStack Query manages state, Wouter handles client-side routing, and Vite is the build tool. WebSocket integration provides real-time updates for call statuses.

### Backend Architecture
The backend is powered by Node.js with Express.js, written in TypeScript. It features RESTful API endpoints, a WebSocket server for broadcasting events, and uses TSX for hot reloading during development and ESBuild for production bundling.

### Database & ORM
PostgreSQL, hosted on Neon for serverless capabilities, is the chosen database. Drizzle ORM provides type-safe schema definitions and is used with Drizzle Kit for migrations. The schema includes tables for users, contacts, campaigns, WhatsApp templates, bulk message jobs, contact engagement, and campaign metrics.

### AI Calling Integration
The platform integrates Twilio for call management, OpenAI GPT models for conversational AI, and ElevenLabs for high-quality text-to-speech. It orchestrates the complete call flow, from initiation to completion, with conversation tracking, real-time monitoring, and authenticated recording downloads. The system only supports actual Twilio recordings with proper API authentication - no demo or sample recordings are generated.

### WhatsApp Integration
Meta Business API is integrated for WhatsApp messaging, managing bulk campaigns, template-based messaging with dynamic variables, and contact engagement tracking. The system supports sending messages and tracking delivery and read statuses. Phone number cleaning automatically removes "+" signs and non-digit characters to ensure API compatibility.

### Authentication & Security
Session management is handled by Express sessions with PostgreSQL storage. Environment variables manage credentials, Zod schemas enforce input validation, and comprehensive error handling and logging are in place.

### Real-time Features
A WebSocket server facilitates bi-directional communication, broadcasting live call status updates and metrics for real-time dashboard monitoring.

### Development & Build
The project emphasizes type safety with full TypeScript coverage. Development benefits from hot reloading and organized imports. A monorepo structure ensures shared schema and types between client and server.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Hosting**: Development and deployment environment.

### AI & Communication Services
- **OpenAI API**: Used for GPT models and speech recognition (Whisper).
- **ElevenLabs**: Premium AI voice synthesis.
- **Twilio**: Provides telephony services, including voice calls and webhook management.
- **Meta Business API**: Integrated for WhatsApp bulk messaging and template management.

### Development Tools
- **Vite Plugins**: For development enhancements.
- **Drizzle Kit**: For database schema management.
- **TanStack Query**: For advanced server state management.