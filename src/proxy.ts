import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, tokenIsRight } from "@/lib/access";

/** The workspace is invite-only for now: anyone without the access cookie is sent to the code page first. */
export function proxy(request: NextRequest) {
  if (tokenIsRight(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/app", "/app/:path*"] };
