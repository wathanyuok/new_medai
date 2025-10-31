import { Suspense } from 'react'
import CallbackClient from './CallbackClient'

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="text-center p-10 text-gray-600">กำลังโหลดหน้า Callback...</div>}>
      <CallbackClient />
    </Suspense>
  )
}
