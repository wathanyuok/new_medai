'use client'
import XrayPrint from "@/components/print/PrintXray";
import { useParams, useSearchParams } from "next/navigation";



export default function PDFMergePage() {
    const params = useParams()
    const check_id = useSearchParams().get("check_id");
    const queueId = params.queue_id;
    console.log(queueId)

    return <XrayPrint queue_id={queueId} check_id={check_id} />;
}