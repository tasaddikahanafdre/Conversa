/**
 * CONVERSA META GRAPH API & OAUTH CLIENT
 * Official Meta Messenger Platform integration helpers.
 * Reference: https://developers.facebook.com/docs/messenger-platform
 */

export interface MetaPageCandidate {
  id: string;
  name: string;
  accessToken: string; // Plaintext during exchange only; encrypted immediately before storage
  category?: string;
  tasks?: string[];
  pictureUrl?: string;
}

export interface MetaTokenVerificationResult {
  isValid: boolean;
  pageId?: string;
  pageName?: string;
  scopes?: string[];
  expiresAt?: Date | null;
  error?: string;
}

/**
 * Returns whether Meta App credentials are fully configured
 */
export function isMetaConfigured(): boolean {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  return Boolean(
    appId &&
      appSecret &&
      !appId.startsWith("your-") &&
      !appSecret.startsWith("your-")
  );
}

/**
 * Resolves the active Meta Graph API version (default v21.0)
 */
export function getMetaGraphApiVersion(): string {
  return process.env.META_GRAPH_API_VERSION || "v21.0";
}

/**
 * Resolves the OAuth Redirect URI
 */
export function getMetaRedirectUri(origin?: string): string {
  if (process.env.META_OAUTH_REDIRECT_URI) {
    return process.env.META_OAUTH_REDIRECT_URI;
  }
  const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/api/auth/facebook/callback`;
}

/**
 * Generates official Meta OAuth Authorization Dialog URL
 * Requests required permissions for Page messaging and management.
 */
export function getMetaOAuthUrl(state: string, origin?: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId || appId.startsWith("your-")) {
    throw new Error("META_APP_ID is not configured in environment variables.");
  }

  const redirectUri = getMetaRedirectUri(origin);
  const version = getMetaGraphApiVersion();

  // Scopes for connecting user's Facebook Pages
  // Default to pages_show_list so Meta approves without needing advanced use case reviews in dev
  const scopes = process.env.META_OAUTH_SCOPES || "pages_show_list";

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: scopes,
    response_type: "code",
    auth_type: "rerequest",
  });

  return `https://www.facebook.com/${version}/dialog/oauth?${params.toString()}`;
}

/**
 * Exchanges authorization code for a User Access Token
 */
export async function exchangeCodeForUserToken(
  code: string,
  origin?: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = getMetaRedirectUri(origin);
  const version = getMetaGraphApiVersion();

  if (!appId || !appSecret) {
    throw new Error("Missing Meta App credentials in environment variables.");
  }

  const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const res = await fetch(tokenUrl.toString(), { method: "GET" });
  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || "Failed to exchange authorization code";
    console.error("[Meta OAuth Token Exchange Error]", data.error);
    throw new Error(`Meta OAuth error: ${errorMsg}`);
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Exchanges short-lived User token for a 60-day Long-Lived User Token
 */
export async function exchangeForLongLivedUserToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const version = getMetaGraphApiVersion();

  const url = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId!);
  url.searchParams.set("client_secret", appSecret!);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json();

  if (!res.ok || data.error) {
    console.warn(
      "[Meta Long-Lived Exchange] Fallback to short-lived token:",
      data.error?.message
    );
    return { accessToken: shortLivedToken, expiresIn: 3600 };
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // 60 days
  };
}

/**
 * Fetches all Facebook Pages the authorizing user manages
 * Endpoint: /me/accounts
 */
export async function getAuthorizedPages(
  userAccessToken: string
): Promise<MetaPageCandidate[]> {
  const version = getMetaGraphApiVersion();
  const url = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  url.searchParams.set(
    "fields",
    "id,name,access_token,category,tasks,picture{url}"
  );
  url.searchParams.set("access_token", userAccessToken);

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json();

  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || "Failed to fetch authorized Facebook pages";
    console.error("[Meta /me/accounts Error]", data.error);
    throw new Error(`Meta Graph API error: ${errorMsg}`);
  }

  const rawPages = Array.isArray(data.data) ? data.data : [];

  return rawPages.map((page: any) => ({
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
    category: page.category,
    tasks: Array.isArray(page.tasks) ? page.tasks : [],
    pictureUrl: page.picture?.data?.url,
  }));
}

/**
 * Subscribes a Facebook Page to the Conversa Webhook App
 * Required so Meta pushes messaging events to our webhook endpoint.
 */
export async function subscribePageToApp(
  pageId: string,
  pageAccessToken: string
): Promise<{ success: boolean; error?: string }> {
  const version = getMetaGraphApiVersion();
  const url = `https://graph.facebook.com/${version}/${pageId}/subscribed_apps`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscribed_fields: ["messages", "messaging_postbacks"],
        access_token: pageAccessToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.warn(
        `[Meta Webhook Subscribed Apps Warning for Page ${pageId}]:`,
        data.error?.message
      );
      return { success: false, error: data.error?.message };
    }

    return { success: data.success === true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to subscribe page";
    return { success: false, error: msg };
  }
}

/**
 * Verifies the validity of a stored Page Access Token
 */
export async function verifyPageToken(
  pageId: string,
  pageAccessToken: string
): Promise<MetaTokenVerificationResult> {
  const version = getMetaGraphApiVersion();
  const url = `https://graph.facebook.com/${version}/${pageId}?fields=id,name&access_token=${pageAccessToken}`;

  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        isValid: false,
        error: data.error?.message || "Token is invalid or expired",
      };
    }

    return {
      isValid: true,
      pageId: data.id,
      pageName: data.name,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification request failed";
    return {
      isValid: false,
      error: msg,
    };
  }
}

/**
 * Sends a message to a customer via the Meta Messenger Send API
 * Reference: https://developers.facebook.com/docs/messenger-platform/reference/send-api
 */
export async function sendMessengerMessage(
  pageAccessToken: string,
  recipientId: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const version = getMetaGraphApiVersion();
  const url = `https://graph.facebook.com/${version}/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
        messaging_type: "RESPONSE",
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("[Meta Send API Error]", data.error);
      return { success: false, error: data.error?.message || "Failed to send message" };
    }

    return { success: true, messageId: data.message_id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error sending message";
    return { success: false, error: msg };
  }
}
