import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { parseUFDRFile } from '@/lib/ufdr-parser';
import { createAPIResponse, createErrorResponse } from '@/lib/utils';

// Helper function to safely parse dates
function safeParseDate(dateString: any): Date {
  if (!dateString) {
    return new Date(); // Return current date if no timestamp provided
  }
  
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid date string: ${dateString}, using current date`);
    return new Date(); // Return current date if invalid
  }
  
  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;
    const deviceName = formData.get('deviceName') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Parse UFDR file
    const parsedData = await parseUFDRFile(filepath, file.name);

    // Create or get case
    let caseRecord;
    if (caseId) {
      caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
      if (!caseRecord) {
        return NextResponse.json(
          { error: 'Case not found with provided ID' },
          { status: 404 }
        );
      }
    } else {
      // Auto-create a case if none provided
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const caseNumber = `AUTO-${timestamp}-${Date.now().toString().slice(-4)}`;
      
      caseRecord = await prisma.case.create({
        data: {
          caseNumber,
          caseName: `Auto-created case for ${file.name}`,
          description: `Automatically created case during file upload of ${file.name} on ${new Date().toLocaleDateString()}`,
        },
      });
    }

    // Create device record
    const device = await prisma.device.create({
      data: {
        deviceName: deviceName || parsedData.deviceInfo.deviceName || 'Unknown Device',
        deviceType: parsedData.deviceInfo.deviceType || 'Mobile',
        imei: parsedData.deviceInfo.imei,
        phoneNumber: parsedData.deviceInfo.phoneNumber,
        manufacturer: parsedData.deviceInfo.manufacturer,
        model: parsedData.deviceInfo.model,
        osVersion: parsedData.deviceInfo.osVersion,
        extractionDate: safeParseDate(parsedData.deviceInfo.extractionDate),
        caseId: caseRecord.id,
      },
    });

    // Import chats
    if (parsedData.chats && parsedData.chats.length > 0) {
      await prisma.chat.createMany({
        data: parsedData.chats.map((chat: any) => ({
          platform: chat.platform,
          conversationId: chat.conversationId,
          participantName: chat.participantName,
          participantNumber: chat.participantNumber,
          message: chat.message,
          timestamp: safeParseDate(chat.timestamp),
          direction: chat.direction,
          messageType: chat.messageType || 'text',
          attachmentPath: chat.attachmentPath,
          isDeleted: chat.isDeleted || false,
          embedding: chat.embedding || [],
          deviceId: device.id,
        })),
      });
    }

    // Import calls
    if (parsedData.calls && parsedData.calls.length > 0) {
      await prisma.call.createMany({
        data: parsedData.calls.map((call: any) => ({
          callType: call.callType,
          phoneNumber: call.phoneNumber,
          contactName: call.contactName,
          duration: call.duration || 0,
          timestamp: safeParseDate(call.timestamp),
          deviceId: device.id,
        })),
      });
    }

    // Import contacts
    if (parsedData.contacts && parsedData.contacts.length > 0) {
      await prisma.contact.createMany({
        data: parsedData.contacts.map((contact: any) => ({
          name: contact.name,
          phoneNumbers: contact.phoneNumbers || [],
          emails: contact.emails || [],
          organization: contact.organization,
          notes: contact.notes,
          deviceId: device.id,
        })),
      });
    }

    // Import media
    if (parsedData.media && parsedData.media.length > 0) {
      await prisma.media.createMany({
        data: parsedData.media.map((media: any) => ({
          mediaType: media.mediaType,
          fileName: media.fileName,
          filePath: media.filePath,
          fileSize: media.fileSize || 0,
          mimeType: media.mimeType,
          createdDate: safeParseDate(media.createdDate),
          modifiedDate: safeParseDate(media.modifiedDate),
          latitude: media.latitude,
          longitude: media.longitude,
          thumbnailPath: media.thumbnailPath,
          metadata: media.metadata || {},
          deviceId: device.id,
        })),
      });
    }

    return NextResponse.json(
      createAPIResponse({
        deviceId: device.id,
        stats: {
          chats: parsedData.chats?.length || 0,
          calls: parsedData.calls?.length || 0,
          contacts: parsedData.contacts?.length || 0,
          media: parsedData.media?.length || 0,
        },
      }, 'UFDR file processed successfully')
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to process file',
        500
      ),
      { status: 500 }
    );
  }
}