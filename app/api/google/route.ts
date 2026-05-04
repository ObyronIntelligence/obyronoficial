import { NextResponse } from "next/server";
import { GoogleAutomationService } from "@/lib/actions/google-automation";

export async function GET() {
  return NextResponse.json({
    ...GoogleAutomationService.getStatus(),
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/oauth/callback",
  });
}
