import React from "react";
import HeaderPage from "./headerPage";
import PageFooter from "./pageFooter";
import ContentPage from "./contentPage";

export default function pagePaper({ indexPaper, labData }) {
  return (
    <>
      <div className="p-4 overflow-y-auto">
        <HeaderPage labData={labData}></HeaderPage>
        <ContentPage indexPaper={indexPaper} list={labData.checks}></ContentPage>
        <PageFooter labData={labData}></PageFooter>
      </div>
    </>
  );
}
