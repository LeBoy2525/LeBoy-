import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRole } from "@/lib/auth";
import { USE_DB } from "@/lib/dbFlag";

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

    let notifications: any[] = [];
    let unreadCount = 0;

    if (USE_DB) {
      // Utiliser Prisma pour récupérer les notifications
      const { getAllNotifications: getAllNotificationsDB, getUnreadNotifications: getUnreadNotificationsDB } = await import("@/repositories/notificationsRepo");
      
      if (unreadOnly) {
        const unread = await getUnreadNotificationsDB();
        notifications = unread.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          missionId: n.missionId,
          missionRef: n.missionRef,
          demandeId: n.demandeId,
          clientEmail: n.clientEmail,
          prestataireName: n.prestataireName,
          createdAt: n.createdAt.toISOString(),
          read: n.read,
          readAt: n.readAt?.toISOString() || null,
        }));
        unreadCount = notifications.length;
      } else {
        const all = await getAllNotificationsDB();
        notifications = all.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          missionId: n.missionId,
          missionRef: n.missionRef,
          demandeId: n.demandeId,
          clientEmail: n.clientEmail,
          prestataireName: n.prestataireName,
          createdAt: n.createdAt.toISOString(),
          read: n.read,
          readAt: n.readAt?.toISOString() || null,
        }));
        // Compter les non lues
        const unread = await getUnreadNotificationsDB();
        unreadCount = unread.length;
      }
    } else {
      // Utiliser le store JSON (fallback)
      const { getAllNotifications, getUnreadNotifications } = await import("@/lib/adminNotificationsStore");
      notifications = unreadOnly ? getUnreadNotifications() : getAllNotifications();
      unreadCount = getUnreadNotifications().length;
    }

    // Trier par date de création (plus récentes en premier)
    const sortedNotifications = notifications.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`[API Notifications] 📊 ${sortedNotifications.length} notification(s) retournée(s) (${unreadCount} non lue(s))`);

    return NextResponse.json(
      {
        notifications: sortedNotifications,
        unreadCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API Notifications] ❌ Erreur:", error);
    console.error("[API Notifications] Stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Erreur serveur.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
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
      if (USE_DB) {
        const { markAllNotificationsAsRead: markAllNotificationsAsReadDB } = await import("@/repositories/notificationsRepo");
        await markAllNotificationsAsReadDB();
      } else {
        const { markAllNotificationsAsRead } = await import("@/lib/adminNotificationsStore");
        markAllNotificationsAsRead();
      }
      return NextResponse.json(
        { success: true, message: "Toutes les notifications ont été marquées comme lues." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Action non reconnue." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API Notifications POST] ❌ Erreur:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

