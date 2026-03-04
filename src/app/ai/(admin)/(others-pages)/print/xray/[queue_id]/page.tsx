'use client'
import { Suspense } from "react";
import XrayPrint from "@/components/print/PrintXray";
import { useParams, useSearchParams } from "next/navigation";

function PDFMergePage() {
    const params = useParams()
    const check_id = useSearchParams().get("check_id");
    const queueId = params.queue_id;
    console.log(queueId)
    return <XrayPrint queue_id={queueId} check_id={check_id} />;
}

const PageWrapper = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
    <PDFMergePage />
  </Suspense>
);

export default PageWrapper;
