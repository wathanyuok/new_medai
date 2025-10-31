'use client'
import LabPrint from "@/components/print/PrintLab";
import { useParams } from "next/navigation";



export default function PDFMergePage() {
  const params = useParams()
  const queueId = params.queue_id;
  console.log(queueId)
  
  return <LabPrint queue_id={queueId} />;
}