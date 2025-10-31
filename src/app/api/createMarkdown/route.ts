import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // รับข้อมูล JSON จาก request
    const data = await req.json();
    
    if (!data) {
      return new Response('ไม่พบข้อมูล JSON สำหรับการวิเคราะห์', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    // สร้าง prompt สำหรับ Claude AI
    const prompt = `
วิเคราะห์ข้อมูล JSON ทางการแพทย์ต่อไปนี้ และแปลงเป็นภาษาที่เข้าใจง่ายสำหรับผู้ที่ไม่มีความรู้ทางการแพทย์:
โดยให้ดำเนินการตามขั้นตอนต่อไปนี้:
1. แยกแยะและสรุปข้อมูลพื้นฐานจาก JSON:
- ข้อมูลผู้ป่วย (ชื่อ-นามสกุล ใช้ ctm_fname + ctm_lnam, อายุ ใช้ age, เพศ ใช้ ctm_gender )
- ข้อมูลการตรวจ (วันที่ และ user_fullnameเท่านั้น)

2. สำหรับผลการตรวจแต่ละรายการใน JSON:
- ชื่อการตรวจที่เข้าใจง่าย (แปลศัพท์เทคนิคเป็นภาษาทั่วไป)
- ค่าที่วัดได้ปัจจุบัน ใช้  chk_value
- เปรียบเทียบกับค่าเก่า ใช้ chk_old (ถ้ามี)
- flag ใช้ chk_flag
- อธิบายความหมายของค่าที่วัดได้ในภาษาที่เข้าใจง่าย

ข้อมูล JSON: ${JSON.stringify(data)}
ถ้าไม่พบข้อมูล JSON ให้บอกว่า "ไม่พบข้อมูลที่นำไปวิเคราะห์ได้"
`;

    // เตรียม payload สำหรับส่งไปยัง Anthropic API

    console.log(prompt)
    const payload = {
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      max_tokens: 20000,
      stream: false,
    };

    // ส่งข้อมูลไปยัง Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // รับผลลัพธ์จาก API
    const result = await response.json();

    // ตรวจสอบข้อผิดพลาด
    if (result.error) {
      console.error('API Response Error:', result);
      
      // จัดการกรณี API มีการใช้งานมากเกินไป
      if (result.error.type === 'overloaded_error') {
        return new Response('ขออภัย ขณะนี้ระบบ AI มีผู้ใช้งานจำนวนมาก กรุณาลองใหม่ในอีกสักครู่', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      
      // จัดการข้อผิดพลาดทั่วไป
      return new Response(`เกิดข้อผิดพลาด: ${result.error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    // ตรวจสอบว่ามีเนื้อหาตอบกลับหรือไม่
    if (!result.content || !Array.isArray(result.content) || result.content.length === 0) {
      console.error('API Response Error: No content returned', result);
      return new Response('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล กรุณาลองใหม่อีกครั้ง', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    // สร้าง response กรณีสำเร็จ
    return new Response(result.content[0].text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    // จัดการข้อผิดพลาดทั่วไป
    console.error('Unexpected error:', error);
    return new Response('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}