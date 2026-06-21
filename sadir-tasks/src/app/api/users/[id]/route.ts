import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/permissions";

// PATCH /api/users/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  if (!Permissions.canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.role && { role: body.role }),
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json(updated);
}
