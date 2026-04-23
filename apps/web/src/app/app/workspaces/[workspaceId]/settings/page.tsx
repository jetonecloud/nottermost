"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { setToken } from "../../../../../lib/api";
import { Button } from "../../../../../components/ui/Button";

export default function SettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = useMemo(() => params.workspaceId, [params.workspaceId]);

  return (
    <div style={{ padding: 16, overflow: "auto" }}>
      <div className="slackPage">
        <div className="slackPageHeader">
          <div>
            <div className="slackPageTitle">Settings</div>
            <div className="slackPageSubtitle">Workspace {workspaceId}</div>
          </div>
        </div>

        <div className="slackPageBody">
          <div className="slackSection">
            <div className="slackSectionTitle">Account</div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>
              Log out removes your local token from this browser.
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setToken(null);
                window.location.href = "/login";
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

