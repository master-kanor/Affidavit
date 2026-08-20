# S3 Evidence Storage Setup

Guide for uploading and managing evidence files on AWS S3 for the Master Kanor Case project.

## Overview

All 2,022 evidence files are stored on S3 cloud storage instead of in the project directory. This provides:
- Scalability for large file collections
- Faster content delivery via CDN
- Reduced deployment size
- Better performance for Vercel
- Automatic backups

## Step 1: Create AWS S3 Bucket

### Option A: AWS Console
1. Go to https://console.aws.amazon.com/s3
2. Click "Create bucket"
3. Bucket name: `master-kanor-case-evidence`
4. Region: Choose closest to your location
5. Block public access: Uncheck (for public access)
6. Create bucket

### Option B: AWS CLI
```bash
aws s3 mb s3://master-kanor-case-evidence --region us-east-1
```

## Step 2: Configure Bucket Policy

Allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::master-kanor-case-evidence/*"
    }
  ]
}
```

## Step 3: Upload Evidence Files

### Option A: AWS Console
1. Go to S3 bucket
2. Click "Upload"
3. Select all evidence files
4. Click "Upload"

### Option B: AWS CLI
```bash
# Upload single file
aws s3 cp /path/to/file.jpg s3://master-kanor-case-evidence/

# Upload entire directory
aws s3 sync /home/ubuntu/evidence_extracted s3://master-kanor-case-evidence/ --recursive

# Upload with specific prefix
aws s3 sync /home/ubuntu/evidence_extracted s3://master-kanor-case-evidence/evidence/ --recursive
```

### Option C: Using Manus Upload
```bash
# For smaller batches
manus-upload-file --webdev /path/to/evidence/file1.jpg /path/to/evidence/file2.jpg
```

## Step 4: Get S3 URLs

### Public URL Format
```
https://master-kanor-case-evidence.s3.amazonaws.com/path/to/file.jpg
https://master-kanor-case-evidence.s3.us-east-1.amazonaws.com/path/to/file.jpg
```

### CloudFront CDN (Optional)
For faster delivery, set up CloudFront:
1. Go to CloudFront console
2. Create distribution
3. Origin: S3 bucket
4. Get CloudFront domain: `d123456.cloudfront.net`
5. Use: `https://d123456.cloudfront.net/path/to/file.jpg`

## Step 5: Update Application Code

### Environment Variables
Add to `.env` and Vercel:

```env
VITE_S3_BUCKET=master-kanor-case-evidence
VITE_S3_REGION=us-east-1
VITE_S3_URL=https://master-kanor-case-evidence.s3.amazonaws.com
```

### Update Gallery Component

```typescript
// client/src/components/EvidenceGallery.tsx

const getS3Url = (filePath: string) => {
  const bucket = import.meta.env.VITE_S3_BUCKET;
  const region = import.meta.env.VITE_S3_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${filePath}`;
};

// Usage
const imageUrl = getS3Url('evidence/folder/image.jpg');
```

## Step 6: Configure CORS (If Needed)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Step 7: Set Up Lifecycle Policies (Optional)

For automatic backups and archival:

1. Go to S3 bucket → Lifecycle
2. Create rule:
   - Transition to Glacier after 90 days
   - Delete after 365 days

## Monitoring & Management

### View Upload Progress
```bash
aws s3 ls s3://master-kanor-case-evidence/ --recursive --human-readable --summarize
```

### Sync Updates
```bash
# Sync only new/changed files
aws s3 sync /home/ubuntu/evidence_extracted s3://master-kanor-case-evidence/ --recursive --exclude "*" --include "*.jpg" --include "*.png" --include "*.mp4"
```

### Delete Files
```bash
# Delete single file
aws s3 rm s3://master-kanor-case-evidence/file.jpg

# Delete entire prefix
aws s3 rm s3://master-kanor-case-evidence/evidence/ --recursive
```

## Cost Estimation

### Storage
- 2,022 files ≈ 1.3 GB
- Cost: ~$0.023/month (S3 Standard)

### Data Transfer
- Outbound: $0.09 per GB
- Inbound: Free
- Estimate: ~$5-10/month for active site

### Total Monthly: ~$5-15

## Security Best Practices

- [ ] Enable versioning
- [ ] Enable MFA delete
- [ ] Use bucket encryption
- [ ] Enable access logging
- [ ] Set up CloudTrail
- [ ] Use IAM roles (not root credentials)
- [ ] Enable bucket policies
- [ ] Regular backups

## Troubleshooting

### Files Not Loading
- Check S3 URL is correct
- Verify bucket policy allows public read
- Check CORS configuration
- Verify file exists in bucket

### Slow Performance
- Enable CloudFront CDN
- Check file sizes
- Use appropriate image formats
- Enable compression

### High Costs
- Review lifecycle policies
- Check for unnecessary uploads
- Monitor data transfer
- Use CloudFront for CDN

## Integration with Application

### Evidence Gallery Component
The gallery component automatically loads from S3:

```typescript
const evidenceFolders = [
  {
    name: "Social Media Channels",
    path: "evidence/social-media/",
    files: [] // Loaded from S3
  }
];
```

### Admin Dashboard
Export functionality includes S3 URLs:

```json
{
  "section": "Identity & Background",
  "evidence": [
    {
      "name": "Facebook Page",
      "url": "https://bucket.s3.amazonaws.com/evidence/social-media/facebook.jpg"
    }
  ]
}
```

## Next Steps

1. Create S3 bucket
2. Upload evidence files
3. Update environment variables
4. Test gallery loading
5. Deploy to Vercel
6. Monitor performance

## Support

- AWS S3 Docs: https://docs.aws.amazon.com/s3/
- AWS CLI: https://aws.amazon.com/cli/
- CloudFront: https://docs.aws.amazon.com/cloudfront/
