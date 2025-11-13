import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';
import { uploadFile, deleteFile } from '../../../../server/r2-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for file uploads

// Maximum file size (50MB for documents/images)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/msword', // .doc
  'application/vnd.ms-excel', // .xls
  'text/plain',
  'text/csv',
  'application/zip',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
    const taskId = formData.get('taskId') ? parseInt(formData.get('taskId') as string) : null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!projectId && !taskId) {
      return NextResponse.json(
        { error: 'Either projectId or taskId must be provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Allowed types: PDF, images (JPEG, PNG, GIF, WebP), Office documents (Word, Excel, PowerPoint), text files, and ZIP archives',
        },
        { status: 400 }
      );
    }

    // Verify project ownership if projectId is provided
    if (projectId) {
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Verify task ownership if taskId is provided
    if (taskId) {
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const folder = projectId ? `projects/${projectId}` : `tasks/${taskId}`;
    const { key, url } = await uploadFile(
      buffer,
      file.name,
      file.type || 'application/octet-stream',
      folder
    );

    // Create database record
    const fileAttachment = await storage.createFileAttachment({
      projectId: projectId || null,
      taskId: taskId || null,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      r2Key: key,
      uploadedBy: session.userId,
      version: 1,
      parentFileId: null,
    });

    return NextResponse.json({
      file: fileAttachment,
      url,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') ? parseInt(searchParams.get('projectId')!) : undefined;
    const taskId = searchParams.get('taskId') ? parseInt(searchParams.get('taskId')!) : undefined;

    if (!projectId && !taskId) {
      return NextResponse.json(
        { error: 'Either projectId or taskId must be provided' },
        { status: 400 }
      );
    }

    // Verify project ownership if projectId is provided
    if (projectId) {
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Verify task ownership if taskId is provided
    if (taskId) {
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const files = await storage.getFileAttachments(projectId, taskId);

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

