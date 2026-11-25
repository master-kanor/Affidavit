export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
  const appId = import.meta.env.VITE_APP_ID || "";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(JSON.stringify({ redirectUri }));
  const url = new URL(`${portalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("state", state);
  return url.toString();
};

export const startLogin = () => {
  window.location.href = getLoginUrl();
};
