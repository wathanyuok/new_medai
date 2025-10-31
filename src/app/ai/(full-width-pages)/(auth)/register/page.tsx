import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Register | EXA Med+",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
