import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
function decodeJwt(token: string): { exp: number } {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
}
export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const lineId = request.cookies.get('lineId')?.value;

    const path = request.nextUrl.pathname;

    const isLoginPage = path === '/login';
    const isCheckAuthPage = path === '/checkAuth';

    const isProtectedRoute = [
        // '/',
        // '/profile',
        // '/aichat',
        // '/service-history',
        // '/health-reports',
        '/commmmmmmm'
    ].includes(path);

    // ✅ ไม่ต้องตรวจอะไรถ้าเป็นหน้า login หรือ checkAuth
    if (isLoginPage || isCheckAuthPage) {
        return NextResponse.next();
    }
 
    // ✅ เฉพาะ route ที่ป้องกันเท่านั้นถึงต้องมี token และ user info
    if (isProtectedRoute) {
        // ไม่มี token → ไป login
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // token หมดอายุ → ไป checkAuth
        let isTokenExpired = false;
        try {
            const decoded = decodeJwt(token);
            const now = Math.floor(Date.now() / 1000);
            isTokenExpired = decoded.exp < now;
        } catch {
            isTokenExpired = true;
        }

        if (isTokenExpired) {
            return NextResponse.redirect(new URL('/checkAuth', request.url));
        }

        // ขาด line data → ไป login
        if (!lineId) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // ✅ ผ่านทุกเงื่อนไขแล้ว → ไปต่อ
    return NextResponse.next();
}

