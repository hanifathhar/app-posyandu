import { NextResponse } from "next/server";
import { GET as getAdminDashboard } from "@/app/api/admin/dashboard/route";

export async function GET(request: Request) {
  return getAdminDashboard(request);
}
