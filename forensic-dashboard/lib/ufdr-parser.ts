import { readFile } from 'fs/promises';
import * as xml2js from 'xml2js';
import { generateEmbedding } from './gemini';

interface UFDRData {
  deviceInfo: {
    deviceName: string;
    deviceType: string;
    imei?: string;
    phoneNumber?: string;
    manufacturer?: string;
    model?: string;
    osVersion?: string;
    extractionDate?: string;
  };
  chats: any[];
  calls: any[];
  contacts: any[];
  media: any[];
  apps: any[];
  locations: any[];
}

export async function parseUFDRFile(filepath: string, filename: string): Promise<UFDRData> {
  const fileExtension = filename.split('.').pop()?.toLowerCase();

  // Handle different UFDR formats
  if (fileExtension === 'xml' || fileExtension === 'ufdr') {
    return parseXMLUFDR(filepath);
  } else if (fileExtension === 'json') {
    return parseJSONUFDR(filepath);
  } else if (fileExtension === 'zip') {
    // For ZIP files containing multiple formats
    return parseZIPUFDR(filepath);
  } else {
    throw new Error('Unsupported file format');
  }
}

async function parseXMLUFDR(filepath: string): Promise<UFDRData> {
  const fileContent = await readFile(filepath, 'utf-8');
  const parser = new xml2js.Parser({
    explicitArray: true,
    mergeAttrs: false,
    explicitCharkey: false,
    attrkey: '$',
    charkey: '_',
    ignoreAttrs: false,
  });
  const result = await parser.parseStringPromise(fileContent);

  const data: UFDRData = {
    deviceInfo: extractDeviceInfo(result),
    chats: await extractChats(result),
    calls: extractCalls(result),
    contacts: extractContacts(result),
    media: extractMedia(result),
    apps: extractApps(result),
    locations: extractLocations(result),
  };

  return data;
}

async function parseJSONUFDR(filepath: string): Promise<UFDRData> {
  const fileContent = await readFile(filepath, 'utf-8');
  const jsonData = JSON.parse(fileContent);

  // Normalize JSON structure - handle different possible structures
  const deviceInfo = jsonData.device || 
                     jsonData.deviceInfo || 
                     jsonData.metadata?.deviceInformation || 
                     {};
  
  // Parse chats - handle nested structure with messages array
  let allChats: any[] = [];
  if (jsonData.chats && Array.isArray(jsonData.chats)) {
    for (const chat of jsonData.chats) {
      if (chat.messages && Array.isArray(chat.messages)) {
        // Handle nested structure: { app: "WhatsApp", participantName: "X", messages: [...] }
        for (const message of chat.messages) {
          allChats.push({
            platform: chat.app || 'Unknown',
            conversationId: chat.participantID || '',
            participantName: chat.participantName || '',
            participantNumber: chat.participantID || '',
            message: message.content || '',
            timestamp: message.timestamp || new Date().toISOString(),
            direction: message.direction?.toLowerCase() || 'unknown',
            messageType: message.messageType || 'text',
            attachmentPath: message.attachment,
            isDeleted: false,
          });
        }
      } else {
        // Handle flat structure
        allChats.push(chat);
      }
    }
  }
  
  // Parse calls - handle both 'calls' and 'callLogs'
  let allCalls: any[] = [];
  const callData = jsonData.calls || jsonData.callLogs || [];
  if (Array.isArray(callData)) {
    allCalls = callData.map((call: any) => ({
      callType: call.direction?.toLowerCase() || call.callType || 'unknown',
      phoneNumber: call.number || call.phoneNumber || '',
      contactName: call.contactName || call.name || '',
      duration: call.durationSeconds || call.duration || 0,
      timestamp: call.timestamp || new Date().toISOString(),
    }));
  }
  
  const data: UFDRData = {
    deviceInfo: {
      deviceName: deviceInfo.deviceName || 
                  deviceInfo.name || 
                  deviceInfo.model || 
                  `${deviceInfo.manufacturer || ''} ${deviceInfo.model || ''}`.trim() ||
                  'Unknown Device',
      deviceType: deviceInfo.deviceType || deviceInfo.type || 'Mobile',
      imei: deviceInfo.imei || deviceInfo.IMEI,
      phoneNumber: deviceInfo.phoneNumber || deviceInfo.number,
      manufacturer: deviceInfo.manufacturer || deviceInfo.make,
      model: deviceInfo.model,
      osVersion: deviceInfo.osVersion || deviceInfo.os,
      extractionDate: deviceInfo.extractionDate || 
                      deviceInfo.extractedOn || 
                      jsonData.metadata?.extractionDate,
    },
    chats: allChats,
    calls: allCalls,
    contacts: jsonData.contacts || [],
    media: jsonData.media || jsonData.files || [],
    apps: jsonData.apps || jsonData.applications || [],
    locations: jsonData.locations || jsonData.gps || [],
  };

  // Generate embeddings for chats
  data.chats = await Promise.all(
    data.chats.map(async (chat) => ({
      ...chat,
      embedding: await generateEmbeddingForChat(chat),
    }))
  );

  return data;
}

async function parseZIPUFDR(filepath: string): Promise<UFDRData> {
  // Implementation for ZIP files
  // This would extract and parse multiple files
  throw new Error('ZIP parsing not yet implemented');
}

function extractDeviceInfo(xmlData: any): any {
  // Handle new comprehensive UFDR structure: UFDR_Report > Metadata > DeviceInformation
  const deviceInfo = xmlData?.UFDR_Report?.Metadata?.[0]?.DeviceInformation?.[0] || {};
  
  return {
    deviceName: deviceInfo.DeviceName?.[0] || 
                deviceInfo.Model?.[0] || 
                deviceInfo.name?.[0] || 
                deviceInfo.deviceName?.[0] || 
                'Unknown Device',
    deviceType: deviceInfo.DeviceType?.[0] || deviceInfo.type?.[0] || 'Mobile',
    imei: deviceInfo.IMEI?.[0] || deviceInfo.imei?.[0],
    phoneNumber: deviceInfo.PhoneNumber?.[0] || 
                 deviceInfo.phoneNumber?.[0] || 
                 deviceInfo.number?.[0],
    manufacturer: deviceInfo.Manufacturer?.[0] || deviceInfo.manufacturer?.[0] || deviceInfo.make?.[0],
    model: deviceInfo.Model?.[0] || deviceInfo.model?.[0],
    osVersion: deviceInfo.OSVersion?.[0] || deviceInfo.OS?.[0] || deviceInfo.osVersion?.[0] || deviceInfo.os?.[0],
    extractionDate: xmlData?.UFDR_Report?.Metadata?.[0]?.ExtractionInfo?.[0]?.ExtractionDate?.[0] ||
                    deviceInfo.extractionDate?.[0] || 
                    deviceInfo.extractedOn?.[0] ||
                    new Date().toISOString(),
  };
}

async function extractChats(xmlData: any): Promise<any[]> {
  let allChats: any[] = [];
  
  // Handle new comprehensive UFDR structure: UFDR_Report > Communications > Messages > Message
  const messages = xmlData?.UFDR_Report?.Communications?.[0]?.Messages?.[0]?.Message || [];
  
  for (const message of messages) {
    const chat = {
      platform: message.Platform?.[0] || 'Unknown',
      conversationId: message.ConversationID?.[0] || '',
      participantName: message.ParticipantName?.[0] || '',
      participantNumber: message.ParticipantNumber?.[0] || '',
      message: message.Message?.[0] || '',
      timestamp: message.Timestamp?.[0] || new Date().toISOString(),
      direction: message.Direction?.[0]?.toLowerCase() || 'unknown',
      messageType: message.MessageType?.[0] || 'text',
      attachmentPath: message.AttachmentPath?.[0] || null,
      isDeleted: message.IsDeleted?.[0] === 'true',
    };
    
    allChats.push(chat);
  }
  
  // Fallback for original UFDR_Report structure: UFDR_Report > Chats > Conversation > Message
  if (allChats.length === 0) {
    const conversations = xmlData?.UFDR_Report?.Chats?.[0]?.Conversation || [];
    
    for (const conversation of conversations) {
      const participantName = conversation.$?.ParticipantName || '';
      const participantId = conversation.$?.ParticipantID || '';
      const app = conversation.$?.App || 'Unknown';
      
      const conversationMessages = conversation.Message || [];
      
      for (const message of conversationMessages) {
        const chat = {
          platform: app,
          conversationId: participantId,
          participantName: participantName,
          participantNumber: participantId,
          message: message.Content?.[0] || '',
          timestamp: message.Timestamp?.[0] || new Date().toISOString(),
          direction: message.Direction?.[0]?.toLowerCase() || 'unknown',
          messageType: 'text',
          attachmentPath: null,
          isDeleted: false,
        };
        
        allChats.push(chat);
      }
    }
  }
  
  // Fallback for other XML structures
  if (allChats.length === 0) {
    const messages = xmlData?.root?.messages?.[0]?.message || 
                     xmlData?.messages?.[0]?.message || 
                     [];

    allChats = messages.map((msg: any) => ({
      platform: msg.$.source || msg.$.platform || 'Unknown',
      conversationId: msg.$.threadId || msg.$.conversationId || '',
      participantName: msg.$.contact || msg.$.name || '',
      participantNumber: msg.$.number || msg.$.address || '',
      message: msg._ || msg.body?.[0] || msg.text?.[0] || '',
      timestamp: msg.$.timestamp || msg.$.date || new Date().toISOString(),
      direction: msg.$.type === '1' || msg.$.direction === 'incoming' ? 'incoming' : 'outgoing',
      messageType: msg.$.mediaType || 'text',
      attachmentPath: msg.$.attachment || msg.$.media,
      isDeleted: msg.$.deleted === 'true' || msg.$.isDeleted === 'true',
    }));
  }

  // Generate embeddings for semantic search
  return await Promise.all(
    allChats.map(async (chat: any) => ({
      ...chat,
      embedding: await generateEmbeddingForChat(chat),
    }))
  );
}

function extractCalls(xmlData: any): any[] {
  let allCalls: any[] = [];
  
  // Handle new comprehensive UFDR structure: UFDR_Report > Communications > Calls > Call
  const calls = xmlData?.UFDR_Report?.Communications?.[0]?.Calls?.[0]?.Call || [];
  
  for (const call of calls) {
    allCalls.push({
      callType: call.CallType?.[0]?.toLowerCase() || 'unknown',
      phoneNumber: call.PhoneNumber?.[0] || '',
      contactName: call.ContactName?.[0] || '',
      duration: parseInt(call.Duration?.[0] || '0', 10),
      timestamp: call.Timestamp?.[0] || new Date().toISOString(),
    });
  }
  
  // Fallback for original UFDR_Report structure: UFDR_Report > CallLogs > Call
  if (allCalls.length === 0) {
    const originalCalls = xmlData?.UFDR_Report?.CallLogs?.[0]?.Call || [];
    
    for (const call of originalCalls) {
      allCalls.push({
        callType: call.Direction?.[0]?.toLowerCase() || 'unknown',
        phoneNumber: call.Number?.[0] || '',
        contactName: call.ContactName?.[0] || '',
        duration: parseInt(call.DurationSeconds?.[0] || '0', 10),
        timestamp: call.Timestamp?.[0] || new Date().toISOString(),
      });
    }
  }
  
  // Fallback for other XML structures
  if (allCalls.length === 0) {
    const fallbackCalls = xmlData?.root?.calls?.[0]?.call || 
                          xmlData?.calls?.[0]?.call || 
                          [];

    allCalls = fallbackCalls.map((call: any) => ({
      callType: call.$.type || call.$.callType || 'unknown',
      phoneNumber: call.$.number || call.$.address || '',
      contactName: call.$.name || call.$.contact,
      duration: parseInt(call.$.duration || '0', 10),
      timestamp: call.$.timestamp || call.$.date || new Date().toISOString(),
    }));
  }
  
  return allCalls;
}

function extractContacts(xmlData: any): any[] {
  let allContacts: any[] = [];
  
  // Handle new comprehensive UFDR structure: UFDR_Report > Contacts > Contact
  const contacts = xmlData?.UFDR_Report?.Contacts?.[0]?.Contact || [];
  
  for (const contact of contacts) {
    const phoneNumbers = contact.PhoneNumbers?.[0]?.PhoneNumber || [];
    const emails = contact.Emails?.[0]?.Email || [];
    
    allContacts.push({
      name: contact.Name?.[0] || '',
      phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers].filter(Boolean),
      emails: Array.isArray(emails) ? emails : [emails].filter(Boolean),
      organization: contact.Organization?.[0] || null,
      notes: contact.Notes?.[0] || null,
    });
  }
  
  // Fallback for other XML structures
  if (allContacts.length === 0) {
    const fallbackContacts = xmlData?.root?.contacts?.[0]?.contact || 
                             xmlData?.contacts?.[0]?.contact || 
                             [];

    allContacts = fallbackContacts.map((contact: any) => ({
      name: contact.$.name || contact.displayName?.[0] || '',
      phoneNumbers: contact.numbers?.[0]?.number?.map((n: any) => n._ || n) || [],
      emails: contact.emails?.[0]?.email?.map((e: any) => e._ || e) || [],
      organization: contact.$.organization || contact.company?.[0],
      notes: contact.$.notes || contact.note?.[0],
    }));
  }
  
  return allContacts;
}

function extractMedia(xmlData: any): any[] {
  let allMedia: any[] = [];
  
  // Handle new comprehensive UFDR structure: UFDR_Report > Media > MediaFile
  const mediaFiles = xmlData?.UFDR_Report?.Media?.[0]?.MediaFile || [];
  
  for (const media of mediaFiles) {
    allMedia.push({
      mediaType: media.MimeType?.[0]?.startsWith('image') ? 'image' : 
                 media.MimeType?.[0]?.startsWith('video') ? 'video' : 
                 media.MimeType?.[0]?.startsWith('audio') ? 'audio' : 'file',
      fileName: media.FileName?.[0] || '',
      filePath: media.FilePath?.[0] || '',
      fileSize: parseInt(media.FileSize?.[0] || '0', 10),
      mimeType: media.MimeType?.[0] || 'unknown',
      createdDate: media.CreationDate?.[0] || new Date().toISOString(),
      modifiedDate: media.ModificationDate?.[0] || new Date().toISOString(),
      latitude: media.GPS_Latitude?.[0] ? parseFloat(media.GPS_Latitude[0]) : null,
      longitude: media.GPS_Longitude?.[0] ? parseFloat(media.GPS_Longitude[0]) : null,
      thumbnailPath: null,
      metadata: {
        md5Hash: media.MD5Hash?.[0] || '',
        gpsLocation: media.GPS_Location?.[0] || '',
        duration: media.Duration?.[0] ? parseInt(media.Duration[0]) : null,
      },
    });
  }
  
  // Fallback for original UFDR_Report structure: UFDR_Report > Images > Image
  if (allMedia.length === 0) {
    const images = xmlData?.UFDR_Report?.Images?.[0]?.Image || [];
    
    for (const image of images) {
      const gpsCoords = image.GPS?.[0]?.split(',') || [];
      const latitude = gpsCoords.length > 0 ? parseFloat(gpsCoords[0].trim()) : null;
      const longitude = gpsCoords.length > 1 ? parseFloat(gpsCoords[1].trim()) : null;
      
      allMedia.push({
        mediaType: 'image',
        fileName: image.FileName?.[0] || '',
        filePath: image.FilePath?.[0] || '',
        fileSize: 0,
        mimeType: image.FileName?.[0]?.endsWith('.JPG') ? 'image/jpeg' : 
                  image.FileName?.[0]?.endsWith('.PNG') ? 'image/png' : 'unknown',
        createdDate: image.Timestamp?.[0] || new Date().toISOString(),
        modifiedDate: image.Timestamp?.[0] || new Date().toISOString(),
        latitude: latitude,
        longitude: longitude,
        thumbnailPath: null,
        metadata: {
          description: image.Description?.[0] || '',
        },
      });
    }
  }
  
  // Fallback for other XML structures
  if (allMedia.length === 0) {
    const fallbackMedia = xmlData?.root?.media?.[0]?.file || 
                          xmlData?.media?.[0]?.file || 
                          [];

    allMedia = fallbackMedia.map((file: any) => ({
      mediaType: file.$.type || file.$.mediaType || 'unknown',
      fileName: file.$.name || file.$.filename || '',
      filePath: file.$.path || file.$.filepath || '',
      fileSize: parseInt(file.$.size || '0', 10),
      mimeType: file.$.mimeType || file.$.mime || '',
      createdDate: file.$.created || file.$.createdDate || new Date().toISOString(),
      modifiedDate: file.$.modified || file.$.modifiedDate || new Date().toISOString(),
      latitude: file.$.latitude ? parseFloat(file.$.latitude) : null,
      longitude: file.$.longitude ? parseFloat(file.$.longitude) : null,
      thumbnailPath: file.$.thumbnail,
      metadata: file.metadata || {},
    }));
  }
  
  return allMedia;
}

function extractApps(xmlData: any): any[] {
  const apps = xmlData?.root?.applications?.[0]?.app || 
               xmlData?.apps?.[0]?.app || 
               [];

  return apps.map((app: any) => ({
    appName: app.$.name || app.$.appName || '',
    packageName: app.$.package || app.$.packageName || '',
    version: app.$.version,
    installDate: app.$.installDate || app.$.installed,
  }));
}

function extractLocations(xmlData: any): any[] {
  const locations = xmlData?.root?.locations?.[0]?.location || 
                    xmlData?.gps?.[0]?.location || 
                    [];

  return locations.map((loc: any) => ({
    latitude: parseFloat(loc.$.lat || loc.$.latitude || '0'),
    longitude: parseFloat(loc.$.lon || loc.$.longitude || '0'),
    accuracy: loc.$.accuracy ? parseFloat(loc.$.accuracy) : null,
    timestamp: loc.$.timestamp || loc.$.date || new Date().toISOString(),
    source: loc.$.source || 'GPS',
  }));
}

async function generateEmbeddingForChat(chat: any): Promise<number[]> {
  try {
    const text = `${chat.participantName || chat.participantNumber}: ${chat.message}`;
    return await generateEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}