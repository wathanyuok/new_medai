import React from "react";
import HeaderPage from "./headerPage";
import ContentPage from "./contentPage";

export default function pagePaper({ prop }) {
  return (
    <>
      <div className="p-4">
        <HeaderPage prop={prop}></HeaderPage>
        <ContentPage prop={prop}></ContentPage>
      </div>
    </>
  );
}
