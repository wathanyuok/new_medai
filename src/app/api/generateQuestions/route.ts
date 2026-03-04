import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { summary } = await req.json();

  const isGreeting = summary.trim().toLowerCase().match(/^(สวัสดี|hello|hi|hey)/);

  if (isGreeting) {
    const responseText = JSON.stringify({
      followupQuestions: [],
    });

    return new Response(responseText, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prompt = `
  ต่อไปนี้คือสรุปผลตรวจสุขภาพ:
  
  ${summary}
  
กรุณาสร้างคำถาม follow-up ที่เกี่ยวข้องกับข้อมูลด้านบน โดยมีคุณสมบัติดังนี้:
  - เป็นคำถามที่คนทั่วไปอาจสงสัยหลังอ่านสรุป
  - จำกัดความยาวไม่เกิน 15 คำต่อคำถาม
  - สร้างคำถาม 3 ข้อ
  - ส่งกลับในรูปแบบ JSON เช่น:
  {
    "followupQuestions": ["...", "...", "..."]
  }
  `;

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 20000,
    temperature: 1,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }]
      }
    ]
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  const answerText = json.content?.[0]?.text || '{}';

  // ✅ ลบ markdown block ถ้ามี
  const cleaned = answerText.replace(/```json|```/g, '').trim();

  return new Response(cleaned, {
    headers: { 'Content-Type': 'application/json' },
  });
}
