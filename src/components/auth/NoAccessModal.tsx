import React from 'react';

const NoAccessModal = () => {
    return (

        <>
            {/* backdrop */}
            <div className="fixed inset-0 bg-black/50 z-9000000000" />

            {/* centered modal */}
            <div className="fixed inset-0 flex items-center justify-center z-90000000000 px-4">
                <div
                    className=" w-[400px] h-[400px] bg-[#E8EDFF] rounded-lg flex flex-col items-center justify-center py-8 px-4 gap-[21px]"
                >
                    <span className="flex w-90 justify-center text-center text-xl font-bold"> กรุณาเข้าสู่ระบบ หรือ สมัครสมาชิก<br />เพื่อดูข้อมูลบัญชีและใช้งานเมนูพิเศษ </span>
                    <button onClick={() => { window.location.href = '/ai/register' }} className="text-white flex flex-row justify-center items-center  py-2 gap-2 w-[227px]  bg-[linear-gradient(91.04deg,_#F73ABB_-9.66%,_#91A3E0_104.11%)] rounded-[45px] flex-none order-0 z-990000000000">
                        สมัครสมาชิก
                    </button>
                    <button onClick={() => { window.location.href = '/ai/login' }} className="text-[#4385EF] flex flex-row justify-center items-center  py-2 gap-2 w-[227px]  bg-white rounded-[45px] flex-none order-0">
                        เข้าสู่ระบบ
                    </button>

                    <span onClick={() => { window.location.href = '/ai/aichat' }} className="cursor-pointer mt-7">
                        <u>
                            ใช้งานต่อโดยไม่เข้าสู่ระบบ
                        </u>
                    </span>
                </div>
            </div>
        </>
    );
}

export default NoAccessModal;
