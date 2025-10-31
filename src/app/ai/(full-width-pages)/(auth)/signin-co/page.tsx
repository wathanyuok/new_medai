import SignInCoForm from "@/components/auth/SignInCoForm";
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Sign in | EXA Med+",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

export default function SignIn() {
  return <SignInCoForm />;
}
