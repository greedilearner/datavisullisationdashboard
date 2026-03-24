import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from 'express';
const app = express(); // This is the birth of 'app'

// Initialize S3 Client for Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

app.post('/api/upload/s3', async (req, res) => {
  const { action } = req.query;
  const { filename, type, uploadId, key, partNumber, parts } = req.body;

  try {
    // STEP 1: Initialize the Multipart Upload
    if (action === 'init') {
      const command = new CreateMultipartUploadCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        ContentType: type,
      });
      const { UploadId, Key } = await s3.send(command);
      return res.json({ uploadId: UploadId, key: Key });
    }

    // STEP 2: Sign an individual chunk (Part)
    if (action === 'sign') {
      const command = new UploadPartCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return res.json({ url });
    }

    // STEP 3: Complete the upload (Join all chunks)
    if (action === 'complete') {
      const command = new CompleteMultipartUploadCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      });
      await s3.send(command);
      return res.json({ location: key });
    }
  } catch (err) {
    console.error("R2 Error:", err);
    res.status(500).json({ error: err.message });
  }
});