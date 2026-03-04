import AppointmentPage from '@/components/pages/AppointmentPage';
import { Metadata } from 'next';
import React from 'react';
export const metadata: Metadata = {
  title: "Appointment | EXA Med+",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};
const Appointment = () => {
    return (
        <><AppointmentPage/></>
    );
}

export default Appointment;
