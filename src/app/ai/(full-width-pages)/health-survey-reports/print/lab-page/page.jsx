"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ComponentToPrint from "./componentToPrint";
import axios from "axios";
import ComponentLoading from "../../../../../../components/ComponentLoad";

function MainPage() {
  const [labData, setLabData] = useState(null);
  const queue_id = useSearchParams().get("queue_id");

  const getLabData = async (id, token) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/queue/check/lab/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data.data;
    } catch (error) {
      console.error("Error fetching lab result", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("hs_acc_token");
      if (!token) {
        console.error("Token not found");
        return;
      }
      const data = await getLabData(queue_id, token);
      setLabData(data);
    };

    if (queue_id) {
      fetchData();
    }
  }, [queue_id]);

  if (!labData || !Array.isArray(labData.checks)) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <ComponentLoading />
      </div>
    );
  }

  const dataList = labData.checks;

  const itemInPaper = 25;

  let paperNum = dataList.length / itemInPaper;
  let paperPage = parseInt(paperNum.toString());
  if (paperNum % itemInPaper !== 0) {
    paperPage++;
  }

  let itemStart = 0;
  let paperList = [];

  for (let i = 0; i < paperPage; i++) {
    let cList = [];
    for (let j = 0; j < itemInPaper; j++) {
      if (itemStart + j < dataList.length) {
        cList.push(dataList[itemStart + j]);
      }
    }
    let paper = { index: i + 1, list: cList };
    paperList.push(paper);
    itemStart += itemInPaper;
  }

  return (
    <div
      className="w-full"
      style={{
        height: `${paperList.length * 1200}px`,
      }}
    >
      <ComponentToPrint labData={labData} />
    </div>
  );
}

export default function Wrapper() {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <MainPage />
    </Suspense>
  );
}
