/**
 * Server-Side Batch API
 *
 * GET  /api/v1/revocred/batch  → Returns current batch status
 * POST /api/v1/revocred/batch  → Start/Stop/Reset batch
 *
 * The batch loop runs in the Node.js process (batch-manager singleton).
 * Survives page navigations, logout, browser close, etc.
 */

import {
  startBatch,
  stopBatch,
  getBatchStatus,
  resetBatch,
} from "@/lib/batch-manager";

export async function GET() {
  const status = getBatchStatus();
  return Response.json(status, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body as { action: string };

  if (action === "start") {
    const result = startBatch({
      startedBy: (body.startedBy as string) || "Admin",
      batchDate: body.batchDate as string,
      batchStatusFilter:
        (body.batchStatusFilter as string) || "analysis_pending",
      batchStepDelay: (body.batchStepDelay as number) || 3,
      batchInterval: (body.batchInterval as number) || 5,
      totalOrders: (body.totalOrders as number) || 0,
      useCurrentDate: (body.useCurrentDate as boolean) || false,
    });

    if (!result.success) {
      return Response.json(
        { error: result.error, locked: true },
        {
          status: 409,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    return Response.json(
      { success: true },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  if (action === "stop") {
    return Response.json(stopBatch(), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  if (action === "reset") {
    return Response.json(resetBatch(), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  return Response.json(
    { error: "Unknown action. Use: start, stop, reset" },
    {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
