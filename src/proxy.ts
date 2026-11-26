import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, tokenIsRight } from "@/lib/access";
import { TRIAL_COOKIE, trialState } from "@/lib/trial";

/**
 * The workspace opens for two kinds of visitor: someone who typed the access code (Founding Cohort members), and someone on a free trial.
 * A trial that has ended goes to the keep-CREO page; anyone else goes to the code page first.
 */
export function proxy(request: NextRequest) {
  if (tokenIsRight(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();
  const trial = trialState(request.cookies.get(TRIAL_COOKIE)?.value);
  if (trial.state === "active") return NextResponse.next();
  const url = request.nextUrl.clone();
  url.search = "";
  if (trial.state === "expired") {
    url.pathname = "/trial/ended";
    return NextResponse.redirect(url);
  }
  url.pathname = "/access";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/app", "/app/:path*"] };
