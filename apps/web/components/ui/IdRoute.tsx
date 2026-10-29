import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading } from "./States";

type RouteParams = Promise<{ id: string }>;

async function Resolved({
  params,
  children,
}: {
  params: RouteParams;
  children: (id: number) => React.ReactNode;
}) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) notFound();
  return <>{children(n)}</>;
}

/**
 * Đọc `params.id` của route động. Với Cache Components, việc đọc params phải
 * nằm trong <Suspense> nên gom lại một chỗ cho các trang /menu/[id], /orders/[id]...
 */
export default function IdRoute({
  params,
  children,
}: {
  params: RouteParams;
  children: (id: number) => React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <Resolved params={params}>{children}</Resolved>
    </Suspense>
  );
}
