import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as generateSignedUrl } from '@aws-sdk/s3-request-presigner';

// Use AWS_ prefix for compatibility with AWS SDK standard
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_ENDPOINT = process.env.AWS_ENDPOINT;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || 'auto';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: for public URLs

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_ENDPOINT || !AWS_BUCKET_NAME) {
  console.warn('R2 credentials not configured. File uploads will not work.');
}

// Initialize S3 client for Cloudflare R2
const s3Client = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_ENDPOINT
  ? new S3Client({
      region: AWS_REGION,
      endpoint: AWS_ENDPOINT,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

export interface UploadFileResult {
  key: string;
  url: string;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadFileResult> {
  if (!s3Client || !AWS_BUCKET_NAME) {
    throw new Error('R2 storage is not configured');
  }

  // Generate unique key: folder/userId_timestamp_filename
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${timestamp}_${sanitizedFileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return public URL if configured, otherwise return key
    const url = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : key;

    return { key, url };
  } catch (error: any) {
    console.error('Error uploading file to R2:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFile(key: string): Promise<void> {
  if (!s3Client || !AWS_BUCKET_NAME) {
    throw new Error('R2 storage is not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error: any) {
    console.error('Error deleting file from R2:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a signed URL for downloading a file (valid for 1 hour)
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!s3Client || !AWS_BUCKET_NAME) {
    throw new Error('R2 storage is not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
    });

    const url = await generateSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
}

/**
 * Get public URL for a file (if public bucket is configured)
 */
export function getPublicUrl(key: string): string | null {
  if (!R2_PUBLIC_URL) {
    return null;
  }
  return `${R2_PUBLIC_URL}/${key}`;
}

