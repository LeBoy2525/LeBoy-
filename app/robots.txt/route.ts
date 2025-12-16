import { NextResponse } from "next/server";

const APP_ENV = process.env.APP_ENV || "local";

export async function GET() {
  // En staging, bloquer tous les robots
  if (APP_ENV === "staging") {
    return new NextResponse(
      `User-agent: *
Disallow: /`,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }

  // En production/local, autoriser l'indexation
  return new NextResponse(
    `User-agent: *
Allow: /`,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}

