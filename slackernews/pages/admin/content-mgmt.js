import AdminLayout from "../../components/admin-layout";
import React from 'react';
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import Link from 'next/link';
import { getTotalLinkCount, getUntitledLinkCount, listTopLinks } from "../../lib/link";
import LinkRow from "../../components/link-row";
import { getTotalScoreCount } from "../../lib/score";

export default function Page({ linkCount, untitledLinkCount, totalScore, renderableLinks, nextPageUrl, startCount, isReplicatedEnabled }) {

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
      rowNumber={startCount+i}
      renderableLink={renderableLink}
      onEdited={onEdited}
      isEditable={true}
      showHide={true}
      showBoost={true}
      isDebugMode={true} />;
  });

  return (
    <div>
      <div style={{display: "flex"}}>
        <div className="large-stat">
          <span className="large-number">{Number(linkCount).toLocaleString()}</span><br />
          <span className="muted">Links</span>
        </div>
        <div className="large-stat">
          <span className="large-number">{Number(untitledLinkCount).toLocaleString()}</span><br />
          <span className="muted">Untitled Links</span>
        </div>
        <div className="large-stat">
          <span className="large-number">{Number(totalScore).toLocaleString()}</span><br />
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
    <AdminLayout currentPage="content-mgmt" slackernewsVersion={page.props.slackernewsVersion} isReplicatedEnabled={page.props.isReplicatedEnabled}>
      {page}
    </AdminLayout>
  );
}

export async function getServerSideProps(ctx) {
  const c = cookies(ctx);
  const sess = await loadSession(c.auth);
  if (!sess) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props:{},
    };
  }

  if (!sess.user.isSuperAdmin) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props:{},
    };
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

  const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";

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
      slackernewsVersion: process.env["SLACKERNEWS_VERSION"],

      isReplicatedEnabled
    },
  };
}
