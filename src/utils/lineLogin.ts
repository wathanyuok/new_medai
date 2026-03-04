export function getLineLoginUrl(state = 'random123') {
    const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI;

    const baseUrl = 'https://access.line.me/oauth2/v2.1/authorize';
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINE_CHANNEL_ID || '',
        redirect_uri: REDIRECT_URI || '',
        state,
        scope: 'profile openid email',
    });

    return `${baseUrl}?${params.toString()}`;
}
export function getLineLogin() {
    
}