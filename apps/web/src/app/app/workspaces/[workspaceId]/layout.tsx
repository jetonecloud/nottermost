"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import type { ChannelListItem } from "@nottermost/shared";

import { apiFetch } from "../../../../lib/api";
import { AppShell } from "../../../../components/AppShell/AppShell";
import { Input } from "../../../../components/ui/Input";

type DmThreadListItem = {
  id: string;
  workspaceId: string;
  kind: "direct" | "group";
  name?: string | null;
  participantEmails: string[];
  lastMessageAt: string | null;
};

type NotifList = { items: Array<{ id: string; readAt: string | null }>; nextCursor: string | null };

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = useMemo(() => params.workspaceId, [params.workspaceId]);
  const pathname = usePathname();
  const router = useRouter();

  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [dmThreads, setDmThreads] = useState<DmThreadListItem[]>([]);
  const [me, setMe] = useState<{
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    statusText?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [meResp, chansResp] = await Promise.all([
          apiFetch<{
            id: string;
            email: string;
            displayName?: string | null;
            avatarUrl?: string | null;
            statusText?: string | null;
          }>("/workspaces/me"),
          apiFetch<ChannelListItem[]>(`/channels?workspaceId=${encodeURIComponent(workspaceId)}`),
        ]);
        const dmResp = await apiFetch<DmThreadListItem[]>(`/dm/threads?workspaceId=${encodeURIComponent(workspaceId)}`);
        const notifResp = await apiFetch<NotifList>(`/notifications?workspaceId=${encodeURIComponent(workspaceId)}&limit=50`);
        if (cancelled) return;
        setMe(meResp);
        setChannels(chansResp);
        setDmThreads(dmResp);
        setUnreadNotifs(notifResp.items.filter((n) => !n.readAt).length);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "load_failed");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    function onProfileUpdated() {
      void (async () => {
        try {
          const meResp = await apiFetch<{
            id: string;
            email: string;
            displayName?: string | null;
            avatarUrl?: string | null;
            statusText?: string | null;
          }>("/workspaces/me");
          setMe(meResp);
        } catch {
          // Ignore profile refresh failures; the shell surfaces load errors on navigation/refresh.
        }
      })();
    }

    window.addEventListener("nottermost.profile.updated", onProfileUpdated);
    return () => window.removeEventListener("nottermost.profile.updated", onProfileUpdated);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("nottermost.lastWorkspaceId", workspaceId);
    } catch {
      void 0;
    }
  }, [workspaceId]);

  const channelItems = channels
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      key: c.id,
      href: c.isMember ? `/app/workspaces/${workspaceId}/channels/${c.id}` : `/app/workspaces/${workspaceId}`,
      label: c.name,
      suffix: !c.isMember ? <span className="pill">Join</span> : c.isPrivate ? <span className="pill">Private</span> : null,
    }));

  const dmItems = dmThreads
    .slice()
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
    .slice(0, 20)
    .map((t) => ({
      key: t.id,
      href: `/app/workspaces/${workspaceId}/threads/${t.id}`,
      label: t.kind === "group" ? t.name ?? t.participantEmails.join(", ") : t.participantEmails.filter((e) => e !== me?.email).join(", "),
    }));

  const channelNameById = useMemo(() => new Map(channels.map((c) => [c.id, c.name])), [channels]);
  const dmLabelById = useMemo(() => {
    return new Map(
      dmThreads.map((t) => [
        t.id,
        t.kind === "group"
          ? t.name ?? t.participantEmails.join(", ")
          : t.participantEmails.filter((e) => e !== me?.email).join(", "),
      ]),
    );
  }, [dmThreads, me?.email]);

  useEffect(() => {
    // Dynamic tab titles for "Slack-like" feel.
    const base = "Nottermost";
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "channels");
    const tidx = parts.findIndex((p) => p === "threads");
    let page = "Workspace";

    if (idx >= 0 && parts[idx + 1]) {
      const cid = parts[idx + 1]!;
      page = `#${channelNameById.get(cid) ?? "channel"}`;
    } else if (tidx >= 0 && parts[tidx + 1]) {
      const id = parts[tidx + 1]!;
      page = dmLabelById.get(id) ?? "Direct messages";
    } else if (parts.includes("search")) page = "Search";
    else if (parts.includes("profile")) page = "Profile";
    else if (parts.includes("settings")) page = "Settings";

    document.title = `${page} • ${base}`;
  }, [pathname, channelNameById, dmLabelById]);

  return (
    <AppShell
      workspaceTitle={me ? me.displayName?.trim() || me.email : null}
      workspaceSubtitle={me?.statusText?.trim() ? me.statusText.trim() : workspaceId}
      workspaceAvatarUrl={me?.avatarUrl?.trim() ? me.avatarUrl.trim() : null}
      workspaceId={workspaceId}
      header={
        <div className="topbar">
          <div className="topbarLeft" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                const q = String(fd.get("q") ?? "").trim();
                if (!q) return;
                router.push(`/app/workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}`);
              }}
              className="topbarSearch"
            >
              <span className="topbarSearchIcon" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                  <path
                    d="M9.2 15.6a6.4 6.4 0 1 1 0-12.8 6.4 6.4 0 0 1 0 12.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path d="M14.1 14.1 17.4 17.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <Input name="q" placeholder="Search…" className="topbarSearchInput" />
            </form>
            {error ? <span className="topbarError">Error: {error}</span> : null}
          </div>
          <div className="topbarRight">
            <span className="topbarHint">Notifications</span>
            <span className="notifBell" title={`${unreadNotifs} unread notifications`} aria-label="Notifications">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
                <path
                  d="M10 18a2.2 2.2 0 0 0 2.2-2.2H7.8A2.2 2.2 0 0 0 10 18Z"
                  fill="currentColor"
                  opacity="0.92"
                />
                <path
                  d="M15.4 14.2H4.6c-.2 0-.4-.1-.5-.3-.1-.2-.1-.4 0-.6.9-1.1 1.4-2.4 1.4-3.8V8.6c0-2.6 1.8-4.8 4.2-5.3V2.8c0-.4.3-.8.8-.8s.8.3.8.8v.5c2.4.5 4.2 2.7 4.2 5.3v.9c0 1.4.5 2.7 1.4 3.8.1.2.2.4 0 .6-.1.2-.3.3-.5.3Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              {unreadNotifs > 0 ? <span className="notifBadge">{unreadNotifs > 99 ? "99+" : unreadNotifs}</span> : null}
            </span>
          </div>
        </div>
      }
      sections={[
        { title: "Workspace", items: [{ key: "home", href: `/app/workspaces/${workspaceId}`, label: "Home" }] },
        { title: "Channels", items: channelItems },
        { title: "Direct messages", items: dmItems },
      ]}
    >
      {children}
    </AppShell>
  );
}

