import React from 'react';
import Image from "next/image";
const AiLoading = () => {
    return (
        <>
            {/* backdrop */}
            <div className="fixed inset-0 bg-black/50 z-9000000000" />

            {/* centered modal */}
            <div className="fixed inset-0 flex items-center justify-center z-90000000000 px-4">
                <div
                    className=" w-[400px] h-[400px] bg-[#ffffff] rounded-lg flex flex-col items-center justify-center py-8 px-4 gap-[21px]"
                >
                   <Image
                src={"/images/gif/ai_thinking.gif"}
                alt="User profile"
                width={150}
                height={150}   
                className="object-cover rotate-45"
              />
              <div>
                <p className='text-center'>
                    AI กำลังดำเนินการวิเคราะห์ข้อมูล
                </p>
                <p className='text-center'>
                    สุขภาพของคุณ อาจใช้เวลาประมวลผลสักพัก
                </p>
                <p className='text-center'>
                   กรุณาอย่าปิดหน้าจอนี้
                </p>
              </div>
                </div>
            </div>
        </>
    );
}

export default AiLoading;
