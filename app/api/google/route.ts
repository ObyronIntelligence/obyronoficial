import { NextResponse } from "next/server";
import { GoogleAutomationService } from "@/lib/actions/google-automation";

export async function GET() {
  return NextResponse.json(GoogleAutomationService.getStatus());
}
