import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  if (!session) {
    const signIn = new URL("/api/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  if (pathname.startsWith("/dashboard/hr")) {
    if (role !== "HR_Revisor" && role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard/resume", req.url));
    }
  }

  if (pathname.startsWith("/dashboard/admin")) {
    if (role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard/resume", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
