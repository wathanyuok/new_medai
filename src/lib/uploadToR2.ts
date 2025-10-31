// lib/uploadToS3.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

export const uploadToS3 = async (
  file: File,
  filePath?: string
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const extension = file.name?.split('.').pop() || 'pdf'
  const key = filePath || `his-ai/${Date.now()}.${extension}`

const command = new PutObjectCommand({
  Bucket: process.env.AWS_BUCKET!,
  Key: key,
  Body: buffer,
  ContentType: file.type,
  ACL: 'public-read' //  เปิดให้ object เป็น public
})

  await s3.send(command)

  // หากตั้ง bucket เป็น public อ่านตรงนี้
  return `${process.env.AWS_PUBLIC_URL}/${key}`
}
