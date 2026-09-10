import { SiteHeader } from "@/components/site-header";
import { WorkflowCatalog } from "@/components/workflow-catalog";
import { categories, workflows } from "@/lib/workflows/catalog";

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; engine?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader solid />
      <WorkflowCatalog
        categories={categories}
        workflows={workflows}
        initialCategory={params.category}
        initialEngine={params.engine}
      />
    </div>
  );
}
