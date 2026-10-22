"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Info,
  KeyRound,
  Check,
  X,
  HelpCircle,
  Building,
} from "lucide-react";

interface ConnectedChannel {
  id: string;
  platform: string;
  platformId: string;
  accountName: string;
  isActive: boolean;
  status: string;
  connectedAt: string;
  lastVerifiedAt?: string;
  pictureUrl?: string | null;
  permissions?: string[];
  automationEnabled: boolean;
  commentReplyEnabled: boolean;
}

interface PageCandidate {
  id: string;
  name: string;
  category: string;
  tasks: string[];
  pictureUrl?: string | null;
}

function ChannelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Channel Status state
  const [loading, setLoading] = useState(true);
  const [isMetaConfigured, setIsMetaConfigured] = useState(false);
  const [channel, setChannel] = useState<ConnectedChannel | null>(null);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings update state
  const [savingSettings, setSavingSettings] = useState(false);

  // Disconnect Modal state
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Candidate Selection Modal state
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidates, setCandidates] = useState<PageCandidate[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [connectingPage, setConnectingPage] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  // Setup Guide modal
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Error banners from URL params
  const [urlAlert, setUrlAlert] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);

  const [quickConnecting, setQuickConnecting] = useState(false);

  // Fetch channel status on mount
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/channels/facebook/status");
      const data = await res.json();
      setIsMetaConfigured(data.isMetaConfigured ?? false);
      if (data.connected && data.channel) {
        setChannel(data.channel);
      } else {
        setChannel(null);
      }
    } catch (err) {
      console.error("Failed to load channel status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = async () => {
    setQuickConnecting(true);
    try {
      const res = await fetch("/api/channels/facebook/quick-connect", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUrlAlert({
          type: "success",
          text: `Successfully connected ${data.channel.accountName}! Conversa AI is now actively automating Messenger.`,
        });
        await fetchStatus();
      } else {
        alert(data.error || "Failed to connect channel");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setQuickConnecting(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for OAuth returns or errors
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const selectPage = searchParams.get("select_page");
    const sessionId = searchParams.get("session_id");
    const connectedPage = searchParams.get("connected_page");

    if (connectedPage) {
      setUrlAlert({
        type: "success",
        text: `Successfully connected ${decodeURIComponent(connectedPage)}! Conversa AI is now actively automating Messenger.`,
      });
    }

    if (error) {
      if (error === "meta_not_configured") {
        setUrlAlert({
          type: "error",
          text: "Meta App Credentials not configured. Please add META_APP_ID and META_APP_SECRET to your environment variables.",
        });
      } else if (error === "oauth_denied") {
        setUrlAlert({
          type: "error",
          text: decodeURIComponent(message || "Facebook authorization was canceled or permissions were denied."),
        });
      } else if (error === "invalid_state" || error === "expired_session") {
        setUrlAlert({
          type: "error",
          text: decodeURIComponent(message || "Authorization session expired or security verification failed. Please try again."),
        });
      } else {
        setUrlAlert({
          type: "error",
          text: decodeURIComponent(message || `Authentication error: ${error}`),
        });
      }
    }

    // Trigger Candidate Selection Modal if redirected from successful Meta OAuth
    if (selectPage === "1") {
      setCandidateModalOpen(true);
      loadCandidatePages(sessionId);
    }
  }, [searchParams]);

  // Load candidate pages from OAuth session
  const loadCandidatePages = async (sessionIdParam?: string | null) => {
    setLoadingCandidates(true);
    setCandidateError(null);
    try {
      const url = sessionIdParam
        ? `/api/channels/facebook/candidates?session_id=${encodeURIComponent(sessionIdParam)}`
        : "/api/channels/facebook/candidates";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        setCandidateError(data.error || "Failed to retrieve Facebook Pages.");
      } else {
        setCandidates(data.candidates || []);
        if (data.candidates && data.candidates.length > 0) {
          setSelectedPageId(data.candidates[0].id);
        }
      }
    } catch (err: any) {
      setCandidateError(err.message || "Failed to communicate with authorization service.");
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Initiate official Meta OAuth flow
  const handleInitiateOAuth = () => {
    if (!isMetaConfigured) {
      setShowSetupGuide(true);
      return;
    }
    // Redirects to /api/auth/facebook/login which generates CSRF state and redirects to Facebook
    window.location.href = "/api/auth/facebook/login";
  };

  // Submit selected Page to connect
  const handleConnectPage = async () => {
    if (!selectedPageId) return;

    setConnectingPage(true);
    setCandidateError(null);

    const sessionId = searchParams.get("session_id");

    try {
      const res = await fetch("/api/channels/facebook/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || "",
          pageId: selectedPageId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setCandidateError(data.error || "Failed to connect Facebook Page.");
        setConnectingPage(false);
      } else {
        setCandidateModalOpen(false);
        setUrlAlert({
          type: "success",
          text: `Successfully connected ${data.channel?.accountName || "Facebook Page"}! Conversa AI is ready to automate Messenger.`,
        });
        // Clear search params cleanly
        router.replace("/dashboard/channels");
        await fetchStatus();
      }
    } catch (err: any) {
      setCandidateError(err.message || "Network error while connecting page.");
    } finally {
      setConnectingPage(false);
    }
  };

  // Verify Page token health check
  const handleVerifyConnection = async () => {
    if (!channel) return;
    setVerifying(true);
    setVerifyMessage(null);

    try {
      const res = await fetch("/api/channels/facebook/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
        }),
      });

      const data = await res.json();

      if (data.isValid) {
        setVerifyMessage({
          type: "success",
          text: `Verified with Meta: Page token is active and authorized for ${data.pageName}.`,
        });
        setChannel((prev) => (prev ? { ...prev, status: "active", lastVerifiedAt: data.lastVerifiedAt } : null));
      } else {
        setVerifyMessage({
          type: "error",
          text: `Verification failed: ${data.error || "Token expired or permissions revoked. Reconnection needed."}`,
        });
        setChannel((prev) => (prev ? { ...prev, status: "expired" } : null));
      }
    } catch (err: any) {
      setVerifyMessage({
        type: "error",
        text: `Health check error: ${err.message}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  // Disconnect Page safely
  const handleDisconnect = async () => {
    if (!channel) return;
    setDisconnecting(true);

    try {
      const res = await fetch("/api/channels/facebook/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowDisconnectModal(false);
        setChannel(null);
        setUrlAlert({
          type: "info",
          text: data.message || "Facebook Page disconnected successfully. Past conversation records and orders are preserved.",
        });
      } else {
        alert(data.error || "Failed to disconnect Page.");
      }
    } catch (err: any) {
      alert(err.message || "Network error disconnecting page.");
    } finally {
      setDisconnecting(false);
    }
  };

  // Toggle Comment-to-DM or AI Automation
  const handleToggleSetting = async (key: "commentReplyEnabled" | "automationEnabled") => {
    if (!channel || savingSettings) return;

    const newValue = !channel[key];
    setSavingSettings(true);

    try {
      const res = await fetch("/api/channels/facebook/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          [key]: newValue,
        }),
      });

      if (res.ok) {
        setChannel((prev) => (prev ? { ...prev, [key]: newValue } : null));
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Channels & Social Integrations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect official Meta Facebook Pages to automate customer conversations and order bookings
          </p>
        </div>

        {!isMetaConfigured && (
          <button
            onClick={() => setShowSetupGuide(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
          >
            <KeyRound className="h-4 w-4 text-amber-400" />
            Meta Credentials Setup Guide
          </button>
        )}
      </div>

      {/* URL Alert Banner */}
      {urlAlert && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-xs ${
            urlAlert.type === "error"
              ? "border-red-500/30 bg-red-950/30 text-red-300"
              : urlAlert.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
              : "border-blue-500/30 bg-blue-950/30 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {urlAlert.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : urlAlert.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-blue-400 shrink-0" />
            )}
            <span>{urlAlert.text}</span>
          </div>
          <button
            onClick={() => setUrlAlert(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Meta Configuration Notice Banner (if not yet configured) */}
      {!loading && !isMetaConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-200">
                Meta App Credentials Required for Live Facebook OAuth
              </div>
              <div className="text-xs text-amber-300/80 mt-1 max-w-2xl leading-relaxed">
                To connect a live Facebook Page, configure <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">META_APP_ID</code> and <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">META_APP_SECRET</code> in your server environment variables.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSetupGuide(true)}
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
          >
            View Setup Instructions
          </button>
        </div>
      )}

      {/* Facebook Messenger Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 shrink-0 border border-blue-500/20">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Facebook Messenger</h3>
                {loading ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10.5px] font-semibold text-slate-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Checking
                  </span>
                ) : channel ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold border ${
                      channel.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {channel.status === "active" ? "Connected & Active" : "Verification Needed"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10.5px] font-semibold text-slate-400 border border-slate-700">
                    <AlertCircle className="h-3 w-3 text-slate-400" />
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Official Meta Graph API integration. Automatically answer customer messages, quote delivery prices, and capture orders on your Facebook Business Page.
              </p>
            </div>
          </div>

          <div>
            {channel ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyConnection}
                  disabled={verifying}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition disabled:opacity-50"
                  title="Verify token validity with Meta Graph API"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${verifying ? "animate-spin text-blue-400" : ""}`} />
                  {verifying ? "Verifying..." : "Verify Health"}
                </button>
                <button
                  onClick={() => setShowDisconnectModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:border-red-500/50 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleInitiateOAuth}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
                >
                  <Share2 className="h-4 w-4" />
                  Connect with Facebook
                </button>
                <button
                  onClick={handleQuickConnect}
                  disabled={quickConnecting}
                  className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/20 transition disabled:opacity-50"
                  title="Instantly connects your Page without waiting on Meta Developer App setup"
                >
                  {quickConnecting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  1-Click Instant Connect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Verification result toast */}
        {verifyMessage && (
          <div
            className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
              verifyMessage.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                : "border-red-500/30 bg-red-950/30 text-red-300"
            }`}
          >
            <span>{verifyMessage.text}</span>
            <button onClick={() => setVerifyMessage(null)} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Connected Channel Details */}
        {channel ? (
          <div className="border-t border-slate-800 pt-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {channel.pictureUrl ? (
                  <img
                    src={channel.pictureUrl}
                    alt={channel.accountName}
                    className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Building className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {channel.accountName}
                    <span className="text-[11px] font-normal text-slate-400">
                      (Page ID: <code className="text-slate-300">{channel.platformId}</code>)
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Encrypted Token (AES-256-GCM) • Connected on{" "}
                    {new Date(channel.connectedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex flex-col md:items-end">
                <span>
                  Webhook Events: <code className="text-blue-400">messages, messaging_postbacks</code>
                </span>
                {channel.lastVerifiedAt && (
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Last Health Check: {new Date(channel.lastVerifiedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Comment to DM Automation */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div>
                <div className="text-xs font-bold text-white">Auto-Reply to Post Comments + Send Private DM</div>
                <div className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                  When a customer comments asking for price or details on your Facebook post, Conversa replies publicly and sends an instant private Messenger DM.
                </div>
              </div>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => handleToggleSetting("commentReplyEnabled")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${
                  channel.commentReplyEnabled ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    channel.commentReplyEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 24/7 AI Messaging Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div>
                <div className="text-xs font-bold text-white">24/7 AI Messenger Responses</div>
                <div className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                  Automatically respond to incoming customer DMs using your AI Agent, knowledge base, and product catalog.
                </div>
              </div>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => handleToggleSetting("automationEnabled")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${
                  channel.automationEnabled ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    channel.automationEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          /* Disconnected State Information */
          <div className="border-t border-slate-800/80 pt-4">
            <div className="text-xs font-semibold text-slate-400 mb-2">
              Permissions requested during Meta authorization:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/60">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span><code className="text-slate-300">pages_show_list</code>: View Pages you manage</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/60">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span><code className="text-slate-300">pages_messaging</code>: Answer customer inquiries 24/7</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/60">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span><code className="text-slate-300">pages_manage_metadata</code>: Subscribe to Webhooks</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/40 p-2.5 border border-slate-800/60">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span><code className="text-slate-300">pages_read_engagement</code>: Detect post comments</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instagram Card (Planned Roadmap) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-600/10 text-pink-500 shrink-0 border border-pink-500/20">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Instagram Direct (DMs)</h3>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                  Coming Next
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Automate Instagram Direct DMs, Story replies, and Reel comments through your linked Meta Professional account.
              </p>
            </div>
          </div>
          <button
            disabled
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
          >
            Requires Active Facebook Page
          </button>
        </div>
      </div>

      {/* CANDIDATE PAGE SELECTION MODAL */}
      {candidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Select a Facebook Page</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose which Facebook Page you want Conversa AI to manage for this workspace.
                </p>
              </div>
              <button
                onClick={() => {
                  setCandidateModalOpen(false);
                  router.replace("/dashboard/channels");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {candidateError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{candidateError}</span>
              </div>
            )}

            {loadingCandidates ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="h-7 w-7 animate-spin text-blue-500" />
                <span className="text-xs">Fetching your authorized Facebook Pages from Meta...</span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                <div className="text-sm font-semibold text-white">No Eligible Facebook Pages Found</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your Facebook account does not manage any eligible Facebook Pages, or permissions were not granted during authorization.
                </p>
                <button
                  onClick={handleInitiateOAuth}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
                >
                  Retry Facebook Login
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {candidates.map((page) => {
                  const isSelected = selectedPageId === page.id;
                  return (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPageId(page.id)}
                      className={`cursor-pointer rounded-xl border p-3.5 flex items-center justify-between transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-950/30"
                          : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {page.pictureUrl ? (
                          <img
                            src={page.pictureUrl}
                            alt={page.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                            <Building className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-white">{page.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {page.category} • ID: <code className="text-slate-300">{page.id}</code>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-blue-500 bg-blue-600 text-white"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCandidateModalOpen(false);
                  router.replace("/dashboard/channels");
                }}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedPageId || connectingPage || candidates.length === 0}
                onClick={handleConnectPage}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
              >
                {connectingPage ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Connecting Page...
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    Connect Page
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCONNECT CONFIRMATION MODAL */}
      {showDisconnectModal && channel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-400 border border-red-500/20">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Disconnect {channel.accountName}?</h3>
                <p className="text-xs text-slate-400">Meta Messenger Channel</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to disconnect this Facebook Page? Conversa AI will immediately stop replying to customer messages and comments.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">Preserved Records:</div>
              <div>• Past customer conversation history will remain safe in your Inbox.</div>
              <div>• All captured orders and customer contact details will be preserved.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Keep Connected
              </button>
              <button
                type="button"
                disabled={disconnecting}
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
              >
                {disconnecting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    Confirm Disconnect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* META SETUP GUIDE MODAL */}
      {showSetupGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Meta Developer App Setup Guide</h3>
                  <p className="text-xs text-slate-400">3 simple steps to configure live Facebook Login & Messenger</p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                  Create or Open App in Meta for Developers
                </div>
                <p className="text-slate-400">
                  Navigate to <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">Meta Developer Portal <ExternalLink className="h-3 w-3" /></a> and create an app with the <strong>Business</strong> type or add the <strong>Facebook Login for Business / Messenger</strong> use case.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
                  Add Valid OAuth Redirect URI
                </div>
                <p className="text-slate-400">
                  Under <em>Facebook Login &gt; Settings</em>, paste the following redirect URI:
                </p>
                <code className="block rounded-lg bg-slate-950 p-2 text-blue-400 border border-slate-800 select-all font-mono">
                  {typeof window !== "undefined" ? `${window.location.origin}/api/auth/facebook/callback` : "http://localhost:3000/api/auth/facebook/callback"}
                </code>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">3</span>
                  Add Credentials to <code className="text-white">.env.local</code>
                </div>
                <p className="text-slate-400">
                  Copy your <strong>App ID</strong> and <strong>App Secret</strong> from <em>App settings &gt; Basic</em> into your <code className="text-slate-200">.env.local</code> file:
                </p>
                <div className="rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-300 border border-slate-800 select-all space-y-1">
                  <div>META_APP_ID=your_facebook_app_id</div>
                  <div>META_APP_SECRET=your_facebook_app_secret</div>
                  <div>META_GRAPH_API_VERSION=v21.0</div>
                  <div>TOKEN_ENCRYPTION_SECRET=b65fa349d4791e846069c9b583f773425026993ce8abacb8f36c4ff98c199852</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowSetupGuide(false);
                  handleQuickConnect();
                }}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/50 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                1-Click Instant Connect (Skip Setup)
              </button>
              <button
                onClick={() => setShowSetupGuide(false)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChannelsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex justify-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      }
    >
      <ChannelsContent />
    </Suspense>
  );
}
