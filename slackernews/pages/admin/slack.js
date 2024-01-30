import AdminLayout from "../../components/admin-layout";
import React, { useState } from 'react';
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import Link from "next/link";
import { getParam, isSlackLoadedFromEnv } from "../../lib/param";
import envConfig from "../../lib/env-config";

import {sendTelemetryEvent} from "../../lib/send-telemetry-event";

export default function Page({
  isConfiguredInEnv,
  initialClientId,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorToast, setSaveErrorToast] = useState(null);
  const [buttonError, setButtonError] = useState(false);

  const [clientId, setClientId] = useState(initialClientId);
  const [botToken, setBotToken] = useState("");
  const [userToken, setUserToken] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const buttonClassNames = buttonError ? "mt-2 btn btn-primary bg-danger border-danger" : "mt-2 btn btn-primary";



  const onSaveClick = async (ev) => {
    ev.preventDefault();
    setSaveErrorToast(null);
    setButtonError(false);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/slack`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botToken,
          userToken,
          clientId,
          clientSecret,
        }),
      });
      if (res.status !== 200) {
        const responseBody = await res.json();
        throw new Error(`Error: ${responseBody.error}`);
      }
    } catch (err) {
      setSaveErrorToast(err.message);
      setButtonError(true);
      setTimeout(() => {
        setButtonError(null);
      }, 2000)
    } finally {
      setIsSaving(false);
    }
  }

  function justShowSlackClientID(clientId) {
    return <>
      <div className="alert alert-warning" role="alert">
        The Slack configuration was provided in the <Link href="/admin/admin-console">Admin Console</Link> configuration
        and is not editable here. To reconfigure the Slack integration, please update the configuration in the Admin
        Console or Helm Values.
      </div>
      <form>
        <div className="form-group">
          <label htmlFor="slackClientId">Client ID</label>
          <input type="text" disabled className="form-control" id="slackClientId" placeholder="Enter client ID"
                 value={clientId}/>
        </div>
      </form>
    </>;
  }

  return (
    <>
      <h1>Slack Configuration</h1>
      <div>
        { isConfiguredInEnv ? justShowSlackClientID(clientId) :
          <>
          <div className="alert alert-info" role="alert">
            Instructions for creating and configuring the Slack application can be found in the <Link href="https://docs.slackernews.io/slack">documentation</Link>.
          </div>
          <form>
            <div className="form-group">

              <label htmlFor="slackClientId">Client ID</label>
              <input type="text" disabled={isSaving} className="form-control" id="slackClientId" placeholder="Enter client ID" value={clientId} onChange={(e) => {
                setClientId(e.target.value);
              }} />

              <label htmlFor="slackClientSecret">Client Secret</label>
              <input type="password" disabled={isSaving} className="form-control" id="slackClientSecret" placeholder="" value={clientSecret} onChange={(e) => {
                setClientSecret(e.target.value);
              }} />

              <label htmlFor="slackUserToken">User Token</label>
              <input type="password" disabled={isSaving} className="form-control" id="slackUserToken" placeholder="xoxp-" value={userToken} onChange={(e) => {
                setUserToken(e.target.value);
              }} />

              <label htmlFor="slackBotToken">Bot Token</label>
              <input type="password" disabled={isSaving} className="form-control" id="slackBotToken" placeholder="xoxb-" value={botToken} onChange={(e) => {
                setBotToken(e.target.value);
              }} />

            </div>
          </form>

            <div className="flex-row">
          <button disabled={isSaving || buttonError} type="submit" className={buttonClassNames} onClick={onSaveClick}>
            { isSaving ? "Saving..." : "Update" }
            </button>
              <p className="text-danger">
                {saveErrorToast}
              </p>
            </div>
          </>

        }
      </div>
    </>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="slack"
                 isReplicatedEnabled={page.props.isReplicatedEnabled}
                 isKOTSManaged={page.props.isKOTSManaged}
                 showChromePluginTab={page.props.showChromePluginTab}
    >
      {page}
    </AdminLayout>
  );
}

export async function getServerSideProps(ctx) {
  const c = cookies(ctx);
  const sess = await loadSession(c.auth);

  // we allow this one page if the user is not logged in, and there is no slack configuration
  const allowAnon = !(await getParam("SlackBotToken"));
  if (!sess && !allowAnon) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props:{},
    };
  }

  if (sess && !sess.user.isSuperAdmin && !allowAnon) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props:{},
    };
  }

  try {
    await sendTelemetryEvent(isReplicatedEnabled, sess.user.email, ctx.req.url, 'pageview.admin.slack');
  } catch (e) {
    console.log("Failed to send telemetry event: " + e);
  }

  const isConfiguredInEnv = await isSlackLoadedFromEnv();
  const {isReplicatedEnabled, isKOTSManaged, showChromePluginTab} = envConfig();
  return {
    props: {
      username: sess ? sess.user.name : "Anomymous",
      hideDuration: true,
      isConfiguredInEnv: isConfiguredInEnv,
      initialClientId: await getParam("SlackClientId") || "",
      isReplicatedEnabled,
      isKOTSManaged,
      showChromePluginTab,
    },
  };
}
