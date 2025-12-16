import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRole } from "@/lib/auth";
import { markNotificationAsRead, deleteNotification } from "@/lib/adminNotificationsStore";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || getUserRole(userEmail) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const notificationId = parseInt(resolvedParams.id);
    
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === "mark_read") {
      const success = markNotificationAsRead(notificationId);
      if (success) {
        return NextResponse.json(
          { success: true, message: "Notification marquée comme lue." },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { error: "Notification non trouvée." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Action non reconnue." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/notifications/[id] PATCH:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || getUserRole(userEmail) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const notificationId = parseInt(resolvedParams.id);
    
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const success = deleteNotification(notificationId);
    if (success) {
      return NextResponse.json(
        { success: true, message: "Notification supprimée." },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Notification non trouvée." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Erreur /api/admin/notifications/[id] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

