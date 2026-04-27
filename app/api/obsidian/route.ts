import { NextRequest, NextResponse } from "next/server";
import { ObsidianAPI } from "@/lib/memory/obsidian-api";

// GET /api/obsidian?action=list|read|search|ping&path=...&query=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "ping";

    switch (action) {
      case "ping": {
        const ok = await ObsidianAPI.ping();
        return NextResponse.json({ connected: ok });
      }
      case "list": {
        const files = await ObsidianAPI.listFiles();
        return NextResponse.json(files);
      }
      case "read": {
        const path = searchParams.get("path");
        if (!path) return NextResponse.json({ error: "Path obrigatório" }, { status: 400 });
        const content = await ObsidianAPI.readNote(path);
        return NextResponse.json({ path, content });
      }
      case "search": {
        const query = searchParams.get("query");
        if (!query) return NextResponse.json({ error: "Query obrigatória" }, { status: 400 });
        const results = await ObsidianAPI.search(query);
        return NextResponse.json({ results });
      }
      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro na API do Obsidian", details: error?.message },
      { status: 500 }
    );
  }
}

// POST /api/obsidian — Criar/atualizar nota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path, content, note } = body;

    switch (action) {
      case "write": {
        if (!path || !content) {
          return NextResponse.json({ error: "path e content obrigatórios" }, { status: 400 });
        }
        await ObsidianAPI.writeNote(path, content);
        return NextResponse.json({ status: "ok", path });
      }
      case "append": {
        if (!path || !content) {
          return NextResponse.json({ error: "path e content obrigatórios" }, { status: 400 });
        }
        await ObsidianAPI.appendToNote(path, content);
        return NextResponse.json({ status: "ok", path });
      }
      case "create_structured": {
        if (!note) {
          return NextResponse.json({ error: "note obrigatório" }, { status: 400 });
        }
        await ObsidianAPI.createStructuredNote(note);
        return NextResponse.json({ status: "ok", title: note.title });
      }
      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro na API do Obsidian", details: error?.message },
      { status: 500 }
    );
  }
}
