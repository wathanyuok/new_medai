"use client";

import React, { useEffect, useState, Suspense } from "react";
import axios from "axios";
import ComponentToPrint from "./componentToPrint";
import { useSearchParams } from "next/navigation";
import ComponentLoading from "../../../../../../components/ComponentLoad";

// Separate content logic into its own component
function ReceiptPageContent() {
  const [pageData, setPageData] = useState(null); // Initialize state for data
  const searchParams = useSearchParams(); // Dynamic query parameters
  const param_id = searchParams?.get("id"); // Fetch `id` parameter

  // Function to fetch data
  const getData = async (id, token) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}receipt/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data.data; // Return fetched data
    } catch (error) {
      console.error("Error fetching receipt data:", error);
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
      setPageData(data); // Set data to state
    };

    if (param_id) {
      fetchData(); // Fetch data when param_id is available
    }
  }, [param_id]);

  if (!pageData) {
    // Show loader while data is being fetched
    return (
      <div className={`w-full flex items-center justify-center py-24`}>
        <ComponentLoading />
      </div>
    );
  }

  const dataList = pageData.subs;

  const itemInPaper = 20;

  let paperNum = dataList.length / itemInPaper;
  let paperPage = parseInt(paperNum.toString());
  if (paperNum % itemInPaper != 0) {
    paperPage++;
  }
  let itemStart = 0;
  let paperList = [];
  for (let i = 0; paperPage > i; i++) {
    let cList = [];
    for (let j = 0; itemInPaper > j; j++) {
      if (itemStart + j < dataList.length) {
        cList.push(dataList[itemStart + j]);
      }
    }
    let paper = { index: i + 1, list: cList };
    paperList.push(paper);
    itemStart += itemInPaper;
  }

  // Render the fetched content
  return (
    <div
      className="w-full"
      style={{
        backgroundColor: "#D9D9D9",
        height: `${paperList.length * 1200}px`,
      }}
    >
      <ComponentToPrint prop={pageData} />
    </div>
  );
}

// Main component with Suspense boundary
export default function ReceiptPage() {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <ReceiptPageContent />
    </Suspense>
  );
}
