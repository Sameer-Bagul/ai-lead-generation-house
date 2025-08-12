// Direct Speech Processing Service
// This service handles speech input directly from Twilio webhooks
// without any recording download or external transcription

export class DirectSpeechService {
  
  // Process speech input directly from Twilio gather webhook
  static processTwilioSpeechInput(
    speechResult: string | undefined,
    unstableSpeechResult: string | undefined,
    digits: string | undefined
  ): string {
    
    // Priority order: SpeechResult -> UnstableSpeechResult -> Digits -> Default
    if (speechResult && speechResult.trim()) {
      console.log(`🎤 Using SpeechResult: "${speechResult}"`);
      return speechResult.trim();
    }
    
    if (unstableSpeechResult && unstableSpeechResult.trim()) {
      console.log(`🎤 Using UnstableSpeechResult: "${unstableSpeechResult}"`);
      return unstableSpeechResult.trim();
    }
    
    if (digits && digits.trim()) {
      console.log(`📞 Using DTMF input: "${digits}"`);
      return `User pressed ${digits}`;
    }
    
    console.log('🎤 No clear speech detected');
    return "I didn't catch that clearly";
  }
  
  // Validate and clean speech input
  static validateSpeechInput(speechText: string): string {
    if (!speechText || speechText.trim().length === 0) {
      return "I didn't hear anything";
    }
    
    // Clean up common speech recognition artifacts
    let cleaned = speechText.trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except punctuation
      .toLowerCase();
    
    // Handle common misheard phrases for Indian context
    const corrections = {
      'lab check': 'LabsCheck',
      'labs check': 'LabsCheck',
      'lab owner': 'lab owner',
      'laboratory': 'lab'
    };
    
    for (const [incorrect, correct] of Object.entries(corrections)) {
      cleaned = cleaned.replace(new RegExp(incorrect, 'gi'), correct);
    }
    
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  // Check if speech indicates call should end
  static shouldEndCall(speechText: string): boolean {
    const endPhrases = [
      'not interested',
      'hang up',
      'end call',
      'goodbye',
      'bye',
      'no thank you',
      'stop calling',
      'remove my number',
      'not now',
      'busy'
    ];
    
    const lowerText = speechText.toLowerCase();
    return endPhrases.some(phrase => lowerText.includes(phrase));
  }
  
  // Extract useful information from speech
  static extractContactInfo(speechText: string): {
    whatsapp?: string;
    email?: string;
    name?: string;
  } {
    const info: any = {};
    
    // Extract WhatsApp number (Indian format) - handle both continuous and spaced digits
    let whatsappMatch = speechText.match(/(?:\+91|91)?\s*[6-9]\d{9}/);
    
    // If no match, try to extract spaced digits (like "9 3 2 5 0 2 5 7 3 0")
    if (!whatsappMatch) {
      // Look for sequences of 10 digits with spaces between them
      const spacedDigitsPattern = /\b[6-9](?:\s+\d){9}\b/;
      const spacedDigits = speechText.match(spacedDigitsPattern);
      if (spacedDigits) {
        const cleanNumber = spacedDigits[0].replace(/\s+/g, '');
        // Validate it's a 10-digit Indian mobile number
        if (cleanNumber.length === 10 && /^[6-9]\d{9}$/.test(cleanNumber)) {
          info.whatsapp = cleanNumber;
        }
      }
    } else {
      info.whatsapp = whatsappMatch[0].replace(/\s+/g, '');
    }
    
    // Extract email - handle both standard format and spoken format (like "dot com")
    let emailMatch = speechText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    
    // If no standard email match, try to parse spoken email format
    if (!emailMatch) {
      // More flexible pattern to capture any spoken email format
      const spokenEmailPattern = /\b[\w\d]+\s*(?:at|@)\s*[\w\d]+(?:\s*(?:dot|\.)\s*[\w\d]+)*\b/i;
      const spokenEmail = speechText.match(spokenEmailPattern);
      if (spokenEmail) {
        const cleanEmail = spokenEmail[0]
          .replace(/\s*at\s*/gi, '@')
          .replace(/\s*dot\s*/gi, '.')
          .replace(/\s+/g, '');
        info.email = cleanEmail;
      }
    } else {
      info.email = emailMatch[0];
    }
    
    // Extract name (basic pattern)
    const namePatterns = [
      /my name is ([a-zA-Z\s]+)/i,
      /i am ([a-zA-Z\s]+)/i,
      /this is ([a-zA-Z\s]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = speechText.match(pattern);
      if (match && match[1]) {
        info.name = match[1].trim();
        break;
      }
    }
    
    return info;
  }
}

export const directSpeechService = DirectSpeechService;