import React from "react";
import HeaderPage from "./headerPage";
import PageFooter from "./pageFooter";
import ContentPage from "./contentPage";

export default function pagePaper({ indexPaper, list, maxPaper, prop }) {
  return (
    <>
      <div className="p-4">
        <HeaderPage
          maxPaper={maxPaper}
          indexPaper={indexPaper}
          prop={prop}
        ></HeaderPage>
        <ContentPage indexPaper={indexPaper} list={list}></ContentPage>
        <PageFooter prop={prop}></PageFooter>
      </div>
    </>
  );
}
