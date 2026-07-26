import { HomePage } from "@/features/home/home-page";
import { normalizeSearchParams } from "@/features/home/home-utils";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: HomePageProps) {
  const params = await searchParams;
  return <HomePage initialFilters={normalizeSearchParams(params)} />;
}
