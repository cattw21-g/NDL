import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
      <section className="rounded-md border border-slate-300 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
        <h1 className="text-4xl font-black leading-tight text-slate-950 dark:text-slate-50">
          Create player profile
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          Player accounts can submit records and track pending, accepted,
          rejected, and needs-changes submissions after email verification.
        </p>
      </section>

      <RegisterForm />
    </div>
  );
}
