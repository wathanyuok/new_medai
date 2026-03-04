import HealthReportsPage from '@/components/pages/HealthReportComponent';
import { Metadata } from 'next';
import React from 'react';
export const metadata: Metadata = {
  title: "Health Report | EXA Med+",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};


const HealthReport = () => {
    return (
        <div>
            <HealthReportsPage/>
        </div>
    );
}

export default HealthReport;
