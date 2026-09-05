import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function TimeMachineRedirect({ searchParams }: Props) {
  const { date } = await searchParams;
  if (date) {
    redirect(`/archive?date=${encodeURIComponent(date)}`);
  }
  redirect("/archive");
}
