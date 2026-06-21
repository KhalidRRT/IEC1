import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/templates
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const templates = await prisma.projectTemplate.findMany({
    include: {
      fields: { orderBy: { order: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}
