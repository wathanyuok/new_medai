import React from "react";
import Link from "next/link";
import pdf from "../../assets/images/icons/svg/pdf.svg";
import Image from "next/image";
const LabXrayTable = ({ items, pathToPrint }) => {
  return (
    <div>
      <table className="table">
        <thead>
          <tr className="text-center">
            <th className="font-14 font-light text-00AD98  border-b">เลขที่</th>
            <th className="font-14 font-light text-00AD98  border-b">รายการ</th>
           
            <th className="whitespace-nowrap font-14 font-light text-00AD98 p-2 border-b">
              ตัวเลือก
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={index}
              className="text-center align-middle hover:bg-gray-100"
            >
              <td className="font-10 text-00AD98 p-3 border-b whitespace-nowrap">
                <div className="flex flex-col">{item.que_code || "-"}</div>
                <div className="flex flex-col">
                  {new Date(item.chk_create).toLocaleDateString("th-TH")}
                </div>
              </td>
              <td className="w-96 font-10 text-00AD98 p-3 border-b ">
                {item.chk_name}
              </td>
           
              <td className="text-center border-b ">
                <Link
                  className="flex justify-center"
                  href={`/print/${pathToPrint}?queue_id=${item.queue_id}`}
                >
                  <Image alt="pdf" src={pdf} width={26} height={26} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LabXrayTable;
