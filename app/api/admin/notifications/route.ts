import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRole } from "@/lib/auth";
import { getAllNotifications, getUnreadNotifications, markAllNotificationsAsRead } from "@/lib/adminNotificationsStore";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || getUserRole(userEmail) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = unreadOnly ? getUnreadNotifications() : getAllNotifications();

    // Trier par date de création (plus récentes en premier)
    const sortedNotifications = notifications.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(
      {
        notifications: sortedNotifications,
        unreadCount: getUnreadNotifications().length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/notifications:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || getUserRole(userEmail) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === "mark_all_read") {
      markAllNotificationsAsRead();
      return NextResponse.json(
        { success: true, message: "Toutes les notifications ont été marquées comme lues." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Action non reconnue." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/notifications POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

