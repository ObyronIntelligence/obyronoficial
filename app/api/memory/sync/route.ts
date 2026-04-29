import { NextRequest, NextResponse } from "next/server";
import { ObsidianMemory } from "@/lib/memory/obsidian-sync";
import path from "path";

// POST /api/memory/sync — Lista notas do vault local
export async function POST(request: NextRequest) {
  try {
    const { vaultPath } = await request.json();
    const resolvedPath = vaultPath || path.join(process.cwd(), "obsidian");
    const notes = await ObsidianMemory.readLocalNotes(resolvedPath);

    return NextResponse.json({
      status: "ok",
      message: `${notes.length} notas encontradas em: ${resolvedPath}`,
      count: notes.length,
    });
  } catch (error: any) {
    console.error("[MEMORY SYNC ERROR]", error);
    return NextResponse.json(
      { error: "Falha na leitura do vault.", details: error?.message },
      { status: 500 }
    );
  }
}
