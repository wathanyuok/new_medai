'use client';

import React, { useEffect, useState } from 'react';
import Register from '@/components/pages/Register';

export default function DevRegisterPage() {
  const [open, setOpen] = useState(true);

  // ให้เปิดตลอดเวลา (ถ้ากดปิด จะเปิดกลับมาใหม่)
  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Register
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultCitizenId="1103701234567" // ใส่เลข mock ได้
        showTermsCheckbox={true}
      />
    </div>
  );
}
