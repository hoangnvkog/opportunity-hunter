import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * Health check endpoint for uptime monitoring (UptimeRobot, Pingdom, etc.)
 *
 * - Tests database connection
 * - Returns 200 OK when healthy
 * - Returns 503 Service Unavailable when database is down
 *
 * Usage:
 *   GET /api/health → 200 { status: "ok", services: { database: "up" } }
 *   GET /api/health → 503 { status: "error", services: { database: "down" } }
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Test database connection
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("sources").select("id").limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        status: "ok",
        timestamp,
        services: {
          database: "up",
          app: "up",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        status: "error",
        timestamp,
        services: {
          database: "down",
          app: "up",
        },
        error: errorMessage,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}