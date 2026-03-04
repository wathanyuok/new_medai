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
      // Fix: Ensure proper URL construction with trailing slash
      // const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm';
      // const url = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}queue/check/xray/${id}`;
      
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/xray/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error; // Re-throw to handle in calling function if needed
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("hs_acc_token"); // Get token from localStorage
      if (!token) {
        console.error("Token not found");
        return;
      }

      try {
        const data = await getData(param_id, token); // Fetch data using param_id and token
        setPageData(data); // Set fetched data to state
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // You might want to set an error state here to show an error message to the user
      }
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
      style={{ backgroundColor: "#D9D9D9", height: "60em" }}
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