import { ShieldCheck } from "lucide-react";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { Eyebrow, PageHeader } from "@/components/ui";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
      <PageHeader
        eyebrow={<Eyebrow icon={ShieldCheck}>Password reset</Eyebrow>}
        title="Choose a new password"
        description="Enter your email, the six-digit reset code, and a new password."
      />
      <ResetPasswordForm email={email} token={token} />
    </div>
  );
}
