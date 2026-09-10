import { categories, workflows } from "@/lib/workflows/catalog";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const engine = searchParams.get("engine");
  const q = searchParams.get("q")?.toLowerCase().trim();

  let items = workflows;
  if (category) items = items.filter((w) => w.category === category);
  if (engine) items = items.filter((w) => w.engine === engine);
  if (q) {
    items = items.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.id.includes(q),
    );
  }

  return NextResponse.json({
    total: items.length,
    categories,
    workflows: items,
  });
}
