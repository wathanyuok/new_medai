import React from 'react';

const NoSyncedComponent = () => {
    return (
        <div className="w-full">
            <div className="flex justify-center py-5">
                <p className="text-lg font-bold text-center sm:text-start max-w-xl">
                    ดูเหมือนว่าคุณยังไม่เคยใช้บริการ EXA MED Clinic หากคุณต้องการการดูแลสุขภาพที่ครบวงจร เราพร้อมที่จะช่วยเหลือคุณ
                </p>
            </div>
            <div className="flex justify-center py-5">
                <button className="text-white flex flex-row justify-center items-center py-4 gap-2 w-[227px] bg-gradient-to-l from-[#EE8DD9] via-[#F639BD] to-[#EE8DD9] rounded-[45px]">
                    ดูบริการของเรา
                </button>
            </div>
        </div>
    );
}

export default NoSyncedComponent;
