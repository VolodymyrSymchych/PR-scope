# Cloudflare R2 Setup Guide

Cloudflare R2 is used for file storage (project documents, task attachments, etc.)

## Your R2 Configuration

- **Account ID:** `0b82934a819e7752ca98a8a5dd06cb7b`
- **Endpoint:** `https://0b82934a819e7752ca98a8a5dd06cb7b.r2.cloudflarestorage.com`
- **Bucket:** `psa`

## Setup Steps

### 1. Create API Token

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com/0b82934a819e7752ca98a8a5dd06cb7b/r2/api-tokens

2. Click **Create API Token**

3. Configure token:
   - **Token Name:** `PSA Production`
   - **Permissions:** Admin Read & Write
   - **Bucket:** Select `psa` or leave as "All buckets"
   - **TTL:** Optional (can leave unlimited)

4. Click **Create API Token**

5. **Important:** Copy the Access Key ID and Secret Access Key immediately!
   - Access Key ID: Starts with a letter
   - Secret Access Key: Long random string
   - You won't be able to see the secret again!

### 2. Configure Environment Variables

#### For Vercel (Production):

1. Go to Vercel Project Settings → Environment Variables
2. Add the following:

```bash
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_ENDPOINT=https://0b82934a819e7752ca98a8a5dd06cb7b.r2.cloudflarestorage.com
AWS_BUCKET_NAME=psa
AWS_REGION=auto
```

3. Optional (for public URLs):
```bash
R2_PUBLIC_URL=https://files.yourdomain.com
```

4. Redeploy your application

#### For Local Development:

Add to your `.env.local`:

```bash
# Cloudflare R2
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_ENDPOINT=https://0b82934a819e7752ca98a8a5dd06cb7b.r2.cloudflarestorage.com
AWS_BUCKET_NAME=psa
AWS_REGION=auto

# Optional: Public URL (requires custom domain setup)
R2_PUBLIC_URL=https://files.yourdomain.com
```

### 3. Set Up Custom Domain (Optional)

To serve files via custom domain (e.g., `https://files.yourdomain.com`):

1. **Connect Domain to R2:**
   - Go to R2 bucket settings
   - Click "Connect Domain"
   - Enter your subdomain: `files.yourdomain.com`

2. **Add DNS Records:**
   - Go to your Cloudflare DNS settings
   - Add CNAME record:
     ```
     Type: CNAME
     Name: files
     Target: 0b82934a819e7752ca98a8a5dd06cb7b.r2.cloudflarestorage.com
     Proxy: Yes (orange cloud)
     ```

3. **Configure CORS (if needed):**
   - Go to R2 bucket settings
   - Add CORS policy:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com", "https://psa-managment.vercel.app"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. **Update Environment Variable:**
   ```bash
   R2_PUBLIC_URL=https://files.yourdomain.com
   ```

## Features Enabled

With R2 configured, users can:

### ✅ Upload Files
- Project documents (requirements, specs, etc.)
- Task attachments (screenshots, logs, etc.)
- Max file size: 100MB per file
- Supported formats: All (PDF, images, documents, archives, etc.)

### ✅ Download Files
- Secure presigned URLs (valid for 1 hour)
- Direct downloads without exposing storage credentials

### ✅ File Versioning
- Track file changes over time
- Restore previous versions

### ✅ File Management
- Delete files when no longer needed
- List files per project/task
- File metadata (size, type, upload date)

## Testing R2 Integration

### Check Connection (Local):
```bash
# Test with curl
curl -X POST http://localhost:3001/api/files \
  -H "Cookie: session=your-session-token" \
  -F "file=@test.pdf" \
  -F "projectId=1"
```

### Test in UI:
1. Go to any project
2. Click "Upload File"
3. Select a file
4. Should see success message
5. File should appear in files list

### Monitor in Cloudflare:
1. Go to R2 Dashboard
2. Click on `psa` bucket
3. Should see uploaded files under `projects/` or `tasks/` folders

## File Structure in R2

Files are organized by type:

```
psa/
├── projects/
│   ├── 1/
│   │   ├── 1699123456789_requirements.pdf
│   │   └── 1699123567890_architecture.png
│   └── 2/
│       └── 1699123678901_specs.docx
└── tasks/
    ├── 10/
    │   ├── 1699123789012_screenshot.png
    │   └── 1699123890123_error_log.txt
    └── 15/
        └── 1699124001234_design.fig
```

## Troubleshooting

### Files Not Uploading

**Check credentials:**
```bash
# Verify env variables are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_BUCKET_NAME
```

**Check logs:**
```bash
# Vercel logs
vercel logs

# Local logs
npm run dev
# Look for "R2 credentials not configured" warning
```

**Common issues:**
- Wrong Access Key ID or Secret
- Bucket name typo (should be `psa`)
- Wrong endpoint URL
- API token expired or revoked

### CORS Errors

If getting CORS errors when uploading:

1. Check CORS policy in R2 bucket settings
2. Ensure your domain is in `AllowedOrigins`
3. Make sure `AllowedMethods` includes `PUT` and `POST`

### Large Files Failing

For files >100MB:

1. Increase Vercel function timeout:
   ```typescript
   export const maxDuration = 300; // 5 minutes
   ```

2. Or implement multipart upload (for files >100MB)

### Files Not Accessible

If files upload but can't be downloaded:

1. Check if using public URLs or presigned URLs
2. Verify custom domain is properly configured
3. Check presigned URL hasn't expired (default 1 hour)

## Cost Estimate

Cloudflare R2 Pricing (as of 2024):

**Free Tier (per month):**
- 10 GB storage
- No egress fees (unlike S3!)
- 1M Class A operations (PUT, POST, etc.)
- 10M Class B operations (GET, etc.)

**Paid Tier:**
- Storage: $0.015 per GB/month
- Class A operations: $4.50 per million
- Class B operations: $0.36 per million
- No egress fees!

**Example costs for 100 active users:**
- 50 GB storage: $0.75/month
- 100K uploads: $0.45/month
- 1M downloads: $0.36/month
- **Total: ~$1.56/month** (vs $50-100 on AWS S3 with egress!)

## Security Best Practices

1. **Never commit credentials:**
   - Always use environment variables
   - Add `.env.local` to `.gitignore`

2. **Use least privilege:**
   - Create separate API tokens for dev/prod
   - Limit token scope to specific buckets

3. **Rotate tokens regularly:**
   - Create new tokens every 90 days
   - Revoke old tokens after rotation

4. **Monitor usage:**
   - Set up usage alerts in Cloudflare
   - Monitor for unusual spikes

5. **Implement file validation:**
   - Check file types before upload
   - Scan for malware if accepting user files
   - Limit file sizes

## Next Steps

1. ✅ Create R2 API token (see Step 1)
2. ✅ Add credentials to Vercel environment variables
3. ✅ Deploy and test file upload
4. 🔄 (Optional) Set up custom domain for public URLs
5. 🔄 (Optional) Configure CORS if needed

## Support

- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **AWS S3 SDK Docs:** https://docs.aws.amazon.com/sdk-for-javascript/v3/
- **Project Issues:** https://github.com/VolodymyrSymchych/PR-scope/issues
