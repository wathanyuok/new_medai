import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


// ⚠️ Move these to environment variables instead of hardcoding
const s3Client = new S3Client({
  region: "ap-southeast-1",
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },


});

export const fetchS3Image = async (objectKey: string): Promise<string | null> => {
  try {
    const command = new GetObjectCommand({
      Bucket: 'apsth-x',
      Key: objectKey,
    });

    const response = await s3Client.send(command);
    const bodyStream = response.Body;

    if (!bodyStream || typeof bodyStream.transformToByteArray !== "function") {
      throw new Error("Failed to retrieve or process image stream");
    }

    const imageBuffer = await bodyStream.transformToByteArray();

    const base64String = Buffer.from(imageBuffer).toString('base64');
    const contentType = response.ContentType || 'image/png';

    return `data:${contentType};base64,${base64String}`;
  } catch (error) {
    console.error(`Error fetching image "${objectKey}":`, error);
    return null;
  }
};
export const getPresignedPDFUrl = async (
  objectKey: string,
  expiresInSeconds: number = 3600 // Default: 1 hour
): Promise<string | null> => {
  try {
    const command = new GetObjectCommand({
      Bucket: 'refer-img', // Your bucket name
      Key: objectKey,
    });

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return presignedUrl;
  } catch (error) {
    console.error(`Error generating presigned URL for "${objectKey}":`, error);
    return null;
  }
};
