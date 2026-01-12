import { Suspense } from "react";
import { HomeClient } from "./HomeClient";
import { fetchYearDataServer } from "@/lib/storage/years-server";

type HomeProps = {
  searchParams: Promise<{ year?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const urlYear = params.year ? parseInt(params.year, 10) : null;
  const currentYear = new Date().getFullYear();
  const initialYear =
    urlYear && !isNaN(urlYear) && urlYear >= 1900 && urlYear <= 2100
      ? urlYear
      : currentYear;

  const initialData = await fetchYearDataServer(initialYear);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted">Завантаження...</div>
        </div>
      }
    >
      <HomeClient initialYear={initialYear} initialData={initialData} />
    </Suspense>
  );
}
