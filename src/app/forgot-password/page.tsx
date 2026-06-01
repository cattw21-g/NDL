import { KeyRound } from "lucide-react";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Eyebrow, PageHeader } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
      <PageHeader
        eyebrow={<Eyebrow icon={KeyRound}>Account recovery</Eyebrow>}
        title="Forgot password"
        description="Enter your account email and NDL will send a reset link with a six-digit code."
      />
      <ForgotPasswordForm />
    </div>
  );
}
