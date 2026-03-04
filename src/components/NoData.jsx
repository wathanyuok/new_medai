import React from "react";
import Lottie from "lottie-react";
import noData from "../../public/images/no-data.json";

const NoDataIllustration = () => {
  const options = {
    animationData: noData,
    loop: false,
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {/* <img src="/images/no-data.gif"
     
      
      /> */}
      <Lottie
        style={{
          width: "300px", // Adjust width
          height: "300px", // Adjust height
          margin: "0 auto", // Center it horizontally
        }}
        loop={false}
        animationData={noData}
      />
      <p className="font-bold" style={{ marginTop: "10px", color: "#555", fontSize: "16px" }}>
        ไม่พบข้อมูล
      </p>
    </div>
  );
};

export default NoDataIllustration;
