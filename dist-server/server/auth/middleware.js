import { getUserBySessionToken } from './session';
import { SESSION_COOKIE_NAME } from './constants';
function parseCookies(rawCookie) {
    if (!rawCookie)
        return {};
    const cookies = {};
    for (const pair of rawCookie.split(';')) {
        const trimmed = pair.trim();
        if (!trimmed)
            continue;
        const index = trimmed.indexOf('=');
        if (index <= 0)
            continue;
        const key = decodeURIComponent(trimmed.slice(0, index));
        const value = decodeURIComponent(trimmed.slice(index + 1));
        cookies[key] = value;
    }
    return cookies;
}
export function getSessionTokenFromRequest(req) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    return token?.trim() ? token : null;
}
export function requireAuth(req, res, next) {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const user = getUserBySessionToken(token);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    req.user = user;
    next();
}
