// app/api/upload/route.ts
import { uploadToS3 } from '@/lib/uploadToR2'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file || typeof file === 'string') {
    return new Response(JSON.stringify({ message: 'Missing file' }), { status: 400 })
  }

  try {
    const url = await uploadToS3(file)
    return new Response(JSON.stringify({ url }), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 })
  }
}
