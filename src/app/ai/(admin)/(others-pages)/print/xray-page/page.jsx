"use client";

import React, { useEffect, useState, Suspense } from "react";
import axios from "axios";
import ComponentToPrint from "./componentToPrint";
import { useSearchParams } from "next/navigation";
import ComponentLoading from "../../../../../../components/ComponentLoad";

// Component for handling the main content
function XrayPageContent() {
  const [pageData, setPageData] = useState(null); // State for fetched data
  const searchParams = useSearchParams(); // Handles query parameters
  const param_id = searchParams?.get("queue_id");

  // Fetch data function
  const getData = async (id, token) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/xray/${id}`,
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
      const token = localStorage.getItem("token"); // Get token from localStorage
      if (!token) {
        console.error("Token not found");
        return;
      }

      const data = await getData(param_id, token); // Fetch data using param_id and token
      setPageData(data); // Set fetched data to state
    };

    if (param_id) {
      fetchData(); // Fetch data when param_id is available
    }
  }, [param_id]);

  // Show loader if data isn't loaded yet
  if (!pageData) {
    return (
      <div className={`w-full flex items-center justify-center py-24`}>
        <ComponentLoading />
      </div>
    );
  }

  // Render the content
  return (
    <div
      className="w-full"
      style={{ backgroundColor: "#f9fafb", height: "60em" }}
    >
      <ComponentToPrint prop={pageData} />
    </div>
  );
}

// Main component with Suspense boundary
export default function XrayPage() {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <XrayPageContent />
    </Suspense>
  );
}
