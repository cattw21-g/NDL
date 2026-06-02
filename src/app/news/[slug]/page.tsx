import { redirect } from "next/navigation";

export default async function NewsPostAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/changelog/${slug}`);
}
