"use client";

import React, { useEffect, useState, Suspense } from "react";
import axios from "axios";
import ComponentToPrint from "./componentToPrint";
import { useSearchParams } from "next/navigation";
import ComponentLoading from "../../../../../../components/ComponentLoad";

function CertificatePageContent() {
  const [custData, setCustData] = useState(null); // State for customer data
  const searchParams = useSearchParams(); // Dynamic query parameters
  const param_id = searchParams?.get("opd_id");

  const getData = async (id, token) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}queue/medicalcert/print/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data.data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      const data = await getData(param_id, token);
      setCustData(data);
    };

    if (param_id) {
      fetchData();
    }
  }, [param_id]);

  if (!custData) {
    return (
      <>
        <div className={`w-full flex items-center justify-center py-24`}>
          <ComponentLoading />
        </div>
      </>
    );
  }

  return (
    <div
      className="w-full"
      style={{ backgroundColor: "#D9D9D9", height: "1200px" }}
    >
      <ComponentToPrint prop={custData} />
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <CertificatePageContent />
    </Suspense>
  );
}
