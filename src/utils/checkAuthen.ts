// lib/auth.ts
import {jwtDecode} from "jwt-decode";

interface DecodedToken {
  exp: number;    // expiry timestamp (in seconds)
  iat?: number;   // optional issued-at timestamp
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
    // exp is in seconds; Date.now() is ms
    return Date.now() >= exp * 1000;
  } catch {
    // malformed token
    localStorage.clear();
    return true;
  }
}

/**
 * Check whether we have a non-expired access token.
 * @returns `true` if there's a valid token, `false` otherwise.
 */
export function checkAccessToken(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export async function  getCustomerDetails(token:string){
  
  // token = getAccessToken()
  if(isTokenExpired(token)) return null;
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.api-apsx.co/crm'}/customer`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
    
  });
  return await response.json();
  
}


