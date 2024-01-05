import AdminLayout from "../../components/admin-layout";
import React, { useState } from 'react';
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import Link from "next/link";
import { getParam, isSlackLoadedFromEnv } from "../../lib/param";

export default function Page({ isConfiguredInEnv, initialBotToken, initialUserToken, initialClientId, initialClientSecret, isReplicatedEnabled}) {
  const [botToken, setBotToken] = useState(initialBotToken);
  const [userToken, setUserToken] = useState(initialUserToken);
  const [clientId, setClientId] = useState(initialClientId);
  const [clientSecret, setClientSecret] = useState(initialClientSecret);

  const onSaveClick = async (ev) => {
    ev.preventDefault();
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
        throw new Error("Error saving Slack configuration");
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <h1>Slack Configuration</h1>
      <div>
        { isConfiguredInEnv ?
          <div className="alert alert-warning" role="alert">
            The Slack configuration was provided in the <Link href="/admin/admin-console">Admin Console</Link> configuration
            and is not editable here. To reconfigure the Slack integration, please update the configuration in the Admin Console.
          </div>
          :
          <div className="alert alert-info" role="alert">
            Instructions for creating and configuring the Slack application can be found in the <Link href="https://docs.slackernews.io/slack">documentation</Link>.
          </div>
      }
        <form>
          <div className="form-group">

            <label htmlFor="slackBotToken">Bot Token</label>
            <input type="text" disabled={isConfiguredInEnv} className="form-control" id="slackBotToken" placeholder="Enter bot token" value={botToken} onChange={(e) => {
              setBotToken(e.target.value);
            }} />

            <label htmlFor="slackUserToken">User Token</label>
            <input type="text" disabled={isConfiguredInEnv} className="form-control" id="slackUserToken" placeholder="Enter user token" value={userToken} onChange={(e) => {
              setUserToken(e.target.value);
            }} />

            <label htmlFor="slackClientId">Client ID</label>
            <input type="text" disabled={isConfiguredInEnv} className="form-control" id="slackClientId" placeholder="Enter client ID" value={clientId} onChange={(e) => {
              setClientId(e.target.value);
            }} />

            <label htmlFor="slackClientSecret">Client Secret</label>
            <input type="text" disabled={isConfiguredInEnv} className="form-control" id="slackClientSecret" placeholder="Enter client secret" value={clientSecret} onChange={(e) => {
              setClientSecret(e.target.value);
            }} />

          </div>

          {
            isConfiguredInEnv ? null :
              <button type="submit" className="btn btn-primary" onClick={onSaveClick}>Update</button>
          }

        </form>
      </div>
    </>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="slack" slackernewsVersion={page.props.slackernewsVersion} isReplicatedEnabled={page.props.isReplicatedEnabled}>
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

  const isConfiguredInEnv = await isSlackLoadedFromEnv();
  const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";
  return {
    props: {
      username: sess ? sess.user.name : "Anomymous",
      hideDuration: true,
      isConfiguredInEnv: isConfiguredInEnv,
      initialBotToken: await getParam("SlackBotToken") || "",
      initialUserToken: await getParam("SlackUserToken") || "",
      initialClientId: await getParam("SlackClientId") || "",
      initialClientSecret: await getParam("SlackClientSecret") || "",
      slackernewsVersion: process.env["SLACKERNEWS_VERSION"],
      isReplicatedEnabled
    },
  };
}
