import React from "react";
import Lottie from "lottie-react";
import loading from "../../public/images/loading.json";

const ComponentLoading = () => {
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
        loop={true}
        animationData={loading}
      />
      <p style={{ marginTop: "10px", color: "#555", fontSize: "16px" }}>
        รอสักครู่
      </p>
    </div>
  );
};

export default ComponentLoading;
