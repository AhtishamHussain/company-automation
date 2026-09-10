import { healthAll, listEngines } from "@/lib/engines/registry";
import { NextResponse } from "next/server";

export async function GET() {
  const [meta, health] = await Promise.all([
    Promise.resolve(listEngines()),
    healthAll(),
  ]);

  return NextResponse.json({
    engines: meta.map((m) => ({
      ...m,
      health: health.find((h) => h.id === m.id),
    })),
  });
}
