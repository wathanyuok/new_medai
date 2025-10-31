import SelectLogin from '@/components/auth/SelectLogin';
import React from 'react';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Login | EXA Med+",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

const LoginPage = () => {
  return (
	<SelectLogin />
  );
};

export default LoginPage;
