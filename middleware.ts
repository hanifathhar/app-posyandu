import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

// Route yang tidak memerlukan autentikasi
const publicRoutes = ["/login", "/unauthorized", "/display", "/pengaduan", "/spm"];

// Route yang hanya bisa diakses admin
const adminOnlyRoutes = ["/master-data"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log("MIDDLEWARE HIT:", request.nextUrl.pathname);

    // Izinkan akses ke semua API routes
    if (pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Izinkan akses ke root (landing page) dan public routes
    if (pathname === "/" || publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Izinkan akses ke static files dan uploads
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/icons") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/uploads")
    ) {
        return NextResponse.next();
    }

    // Cek token dari cookie
    const token = request.cookies.get("token")?.value;

    console.log("🔍 Middleware check:", { pathname, hasToken: !!token });

    if (!token) {
        console.log("❌ No token found, redirecting to login");
        // Redirect ke login jika tidak ada token
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        // Decode token secara manual tanpa verifikasi di middleware
        // Verifikasi akan dilakukan di API route
        const payload = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString()
        );

        console.log("✅ Token payload:", { user: payload.username, role: payload.role });

        // Cek expiry
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log("⏰ Token expired");
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete("token");
            return response;
        }

        // Cek akses admin untuk route master data (hanya SUPERADMIN & ADMIN_KABUPATEN)
        const masterDataRoles = ["SUPERADMIN", "ADMIN_KABUPATEN"];
        if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
            if (!masterDataRoles.includes(payload.role)) {
                console.log("⛔ Access denied - Master Data only for Kabupaten/Superadmin:", payload.role);
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.log("❌ Token invalid:", error);
        // Token invalid, redirect ke login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
    }
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|uploads|images|icons).*)",
  ],
};
