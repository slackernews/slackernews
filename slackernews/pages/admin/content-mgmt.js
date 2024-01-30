import AdminLayout from "../../components/admin-layout";
import React from 'react';
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import Link from 'next/link';
import { getTotalLinkCount, getUntitledLinkCount, listTopLinks } from "../../lib/link";
import LinkRow from "../../components/link-row";
import { getTotalScoreCount } from "../../lib/score";
import envConfig from "../../lib/env-config";
import { PostHog } from 'posthog-node'
import {ReplicatedClient} from "../../lib/replicated-sdk";



export default function Page({
  linkCount,
  untitledLinkCount,
  totalScore,
  renderableLinks,
  nextPageUrl,
  startCount,
  isReplicatedEnabled
}) {

  const onEdited = (link, newTitle) => {
    const updatedLinks = renderableLinks.map(l => {
      if (l.link.url === link.link.url) {
        l.link.title = newTitle;
      }
      return l;
    });

    renderableLinks = updatedLinks;
  }

  const rows = renderableLinks.map((renderableLink, i) => {
    return <LinkRow
      key={renderableLink.link.url}
      rowNumber={startCount + i}
      renderableLink={renderableLink}
      onEdited={onEdited}
      isEditable={true}
      showHide={true}
      showBoost={true}
      isDebugMode={true}/>;
  });

  return (
    <div>
      <div style={{display: "flex"}}>
        <div className="large-stat">
          <span className="large-number">{Number(linkCount).toLocaleString()}</span><br/>
          <span className="muted">Links</span>
        </div>
        <div className="large-stat">
          <span className="large-number">{Number(untitledLinkCount).toLocaleString()}</span><br/>
          <span className="muted">Untitled Links</span>
        </div>
        <div className="large-stat">
          <span className="large-number">{Number(totalScore).toLocaleString()}</span><br/>
          <span className="muted">Points</span>
        </div>
      </div>

      <div>
        <table className="table">
          <tbody>
          {rows}
          <tr className={`more-row ${nextPageUrl ? "" : "d-none"}`}>
            <td colSpan="4" style={{paddingLeft: "56px", paddingTop: "12px"}}>
              <Link href={nextPageUrl}>More</Link>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

Page.getLayout = function getLayout(page) {

  return (
    <AdminLayout currentPage="content-mgmt"
                 isReplicatedEnabled={page.props.isReplicatedEnabled}
                 isKOTSManaged={page.props.isKOTSManaged}
                 showChromePluginTab={page.props.showChromePluginTab}
    >
      {page}
    </AdminLayout>
  );
}

async function sendTelemetryEvent(isReplicatedEnabled, userEmail, currentUrl, loadedContentManagement = 'loaded_content_management') {
  // locally these come from env vars, otherwise check license fields
  // leaving as env vars for now to do the "A State" view where there are not
  // license fields and these get provisioned through config or helm values

  const postHogAPIKey = // isReplicatedEnabled ? (await ReplicatedClient.getEntitlement("posthog_api_key")).value :
      process.env.NEXT_PUBLIC_POSTHOG_KEY;

  const postHogHost = // isReplicatedEnabled ? (await ReplicatedClient.getEntitlement("posthog_api_host")).value :
      process.env.NEXT_PUBLIC_POSTHOG_KEY;

  const client = new PostHog(
      postHogAPIKey,
      {
        host: postHogHost,
      }
  )

  const {licenseID} = isReplicatedEnabled ?
      await ReplicatedClient.getLicenseInfo() :
      {licenseID: "local"};

  // technically this is not guaranteed unique in the way we probably want it to be,
  // should maybe be instanceId if we can get it (instead of licenseId)
  const distinctId = licenseID + "-" + userEmail;

  client.identify({
    distinctId: distinctId,
    properties: {
      $current_url: currentUrl,
      userEmail: userEmail,
      licenseId: licenseID,
      slackernewsVersion: process.env.NEXT_PUBLIC_SLACKERNEWS_VERSION || null,
      nginxVersion: process.env.NEXT_PUBLIC_NGINX_VERSION || null,
    },
  });
  client.capture({
    distinctId: distinctId,
    event: loadedContentManagement,
    properties: {
      $current_url: currentUrl,
      userEmail: userEmail,
      licenseId: licenseID,
      slackernewsVersion: process.env.NEXT_PUBLIC_SLACKERNEWS_VERSION || null,
      nginxVersion: process.env.NEXT_PUBLIC_NGINX_VERSION || null,
    },
  });

  await client.shutdownAsync()
}

export async function getServerSideProps(ctx) {
  const {isReplicatedEnabled, isKOTSManaged, showChromePluginTab} = envConfig();
  const c = cookies(ctx);
  const sess = await loadSession(c.auth);
  if (!sess) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props: {},
    };
  }

  if (!sess.user.isSuperAdmin) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props: {},
    };
  }

  try {
    await sendTelemetryEvent(isReplicatedEnabled, sess, ctx.req.url);
  } catch (e) {
    console.log("Failed to send telemetry event: " + e);
  }

  const linkCount = await getTotalLinkCount();

  const untitledLinkCount = await getUntitledLinkCount();

  const totalScore = await getTotalScoreCount();


  const duration = ctx.query.t ? ctx.query.t : "7d";
  const page = ctx.query.p ? ctx.query.p : "1";

  const renderableLinks = await listTopLinks(duration, page, sess.user.id, [], true, "");

  const nextPageUrl = renderableLinks.length === 30 ?
  ctx.query.t ?
    `/?t=${duration}&p=${parseInt(page) + 1}` :
    `/?p=${parseInt(page) + 1}`
  : null;



  return {
    props: {
      linkCount,
      untitledLinkCount,
      totalScore,
      username: sess.user.name,
      hideDuration: true,
      renderableLinks,
      hasNextPage: renderableLinks.length === 30,
      nextPageUrl: nextPageUrl ? nextPageUrl : "",
      startCount: (parseInt(page) - 1) * 30 + 1,
      isReplicatedEnabled,
      isKOTSManaged,
      showChromePluginTab,
    },
  };
}
