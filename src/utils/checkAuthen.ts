// utils/checkAuthen.ts
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  iat?: number;
  user_id?: number;
  shop_id?: number;
  role_id?: number;
  shop_role_id?: number;
  shop_mother_id?: number;
  user_email?: string;
}

/**
 * Read the token from localStorage (client-side only).
 */
export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

/**
 * Return true if the token is expired or invalid.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<DecodedToken>(token);
    return Date.now() >= exp * 1000;
  } catch {
    localStorage.clear();
    return true;
  }
}

/**
 * Check whether we have a non-expired access token.
 */
export function checkAccessToken(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Get user_id from JWT token
 */
export function getUserIdFromToken(): number | null {
  try {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) return null;

    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.user_id || null;
  } catch {
    return null;
  }
}

/**
 * Get shop_id from JWT token
 */
export function getShopIdFromToken(): number | null {
  try {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) return null;

    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.shop_id || null;
  } catch {
    return null;
  }
}

/**
 * Get customer details from API
 */
export async function getCustomerDetails(token: string) {
  if (isTokenExpired(token)) return null;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "https://shop.api-apsx.co/crm"}/customer`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return await response.json();
}