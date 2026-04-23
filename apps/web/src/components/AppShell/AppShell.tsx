"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "../ui/Icon";

type SidebarSection = {
  title: string;
  items: Array<{
    key: string;
    href: string;
    label: string;
    icon?: ReactNode;
    suffix?: ReactNode;
  }>;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Workspace "home" links should be exact-match only.
  if (/\/app\/workspaces\/[^/]+$/.test(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  workspaceName,
  workspaceTitle,
  workspaceSubtitle,
  workspaceAvatarUrl,
  workspaceId,
  header,
  sections,
  children,
  rightRail,
}: {
  workspaceName?: string | null;
  workspaceTitle?: string | null;
  workspaceSubtitle?: string | null;
  workspaceAvatarUrl?: string | null;
  workspaceId: string;
  header?: ReactNode;
  sections: SidebarSection[];
  children: ReactNode;
  rightRail?: ReactNode;
}) {
  const pathname = usePathname();
  const title = workspaceTitle ?? workspaceName ?? "Workspace";
  const subtitle = workspaceSubtitle ?? workspaceId;
  const letter = useMemo(() => (title ?? "W").slice(0, 1).toUpperCase(), [title]);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const showAvatarImg = Boolean(workspaceAvatarUrl) && !avatarBroken;

  useEffect(() => {
    setAvatarBroken(false);
  }, [workspaceAvatarUrl]);

  return (
    <div className="appFrame">
      <aside className="appSidebar">
        <div className="sidebarTop">
          <Link className="workspaceSwitcher" href={`/app/workspaces/${workspaceId}/profile`} title="Profile">
            <div className="workspaceAvatar" aria-hidden="true">
              {showAvatarImg ? (
                <img
                  className="workspaceAvatarImg"
                  src={workspaceAvatarUrl!}
                  alt=""
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                letter
              )}
            </div>
            <div className="workspaceMeta">
              <div className="workspaceName">{title}</div>
              <div className="workspaceSub">{subtitle}</div>
            </div>
          </Link>

          <div className="sidebarActions">
            <Link className="uiLink" href="/app" title="All workspaces">
              <Icon title="Back to workspaces">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                  <path
                    d="M8.3 4.6 3.2 9.7a.9.9 0 0 0 0 1.2l5.1 5.1"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.7 10h13.1"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Icon>
            </Link>
            <Link className="uiLink" href={`/app/workspaces/${workspaceId}/search`} title="Search">
              <Icon title="Search">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
                  <path
                    d="M9.2 15.6a6.4 6.4 0 1 1 0-12.8 6.4 6.4 0 0 1 0 12.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M14.1 14.1 17.4 17.4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </Icon>
            </Link>
          </div>
        </div>

        <nav className="sidebarNav" aria-label="Workspace navigation">
          {sections.map((section) => (
            <div className="sidebarSection" key={section.title}>
              <div className="sidebarSectionTitle">{section.title}</div>
              <div className="sidebarSectionItems">
                {section.items.map((it) => {
                  const active = isActive(pathname, it.href);
                  return (
                    <Link
                      key={it.key}
                      className={["sidebarItem", active ? "sidebarItem--active" : ""].filter(Boolean).join(" ")}
                      href={it.href}
                      title={it.label}
                    >
                      <span className="sidebarItemIcon">{it.icon ?? <span className="sidebarBullet" />}</span>
                      <span className="sidebarItemLabel">{it.label}</span>
                      {it.suffix ? <span className="sidebarItemSuffix">{it.suffix}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebarBottom">
          <Link className="sidebarBottomItem" href={`/app/workspaces/${workspaceId}/settings`} title="Settings">
            <span className="sidebarBottomIcon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path
                  d="M10 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M16.8 10a6.8 6.8 0 0 0-.1-1l1.2-.9-1.3-2.2-1.5.5a6.7 6.7 0 0 0-1.7-1L13 3H7l-.4 2.4a6.7 6.8 0 0 0-1.7 1l-1.5-.5L2 8.1l1.2.9a7.2 7.2 0 0 0 0 2L2 12l1.3 2.2 1.5-.5a6.7 6.7 0 0 0 1.7 1L7 17h6l.4-2.4a6.7 6.7 0 0 0 1.7-1l1.5.5L18 12l-1.2-.9c.1-.3.1-.7.1-1.1Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="sidebarBottomLabel">Settings</span>
          </Link>
        </div>
      </aside>

      <div className="appMain">
        <header className="appHeader">{header}</header>
        <div className={["appContent", rightRail ? "appContent--withRightRail" : ""].filter(Boolean).join(" ")}>
          <div className="appPane">{children}</div>
          {rightRail ? <div className="appRightRail">{rightRail}</div> : null}
        </div>
      </div>
    </div>
  );
}

