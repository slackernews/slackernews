import Layout from "../../components/layout";
import React from 'react';
import "../../styles/Home.module.css";
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import { listShares } from "../../lib/share";
import { getLink } from "../../lib/link";
import Link from "next/link";
import Button from 'react-bootstrap/Button';

export default function Page({ link, renderableShares}) {

  const onClickRefreshLink = async (share) => {
    try {
      const res = await fetch(`/api/admin/share/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageTs: share.messageTs,
          channelId: share.channelId,
        }),
      });
      if (res.ok) {
        alert("linked refreshed");
      };
    } catch (err) {
      console.error(err);
    }
  }

  const sharesRows = renderableShares.map((renderableShare, i) => {
    return (
      <tr key={renderableShare.messageTs}>
        <td>
          <Button variant="link" size="sm" onClick={onClickRefreshLink.bind(this, renderableShare)}>
            <i className="bi bi-arrow-clockwise"></i>
          </Button>
        </td>
        <td>{new Date(renderableShare.sharedAt).toISOString()}</td>
        <td>{renderableShare.messageTs}</td>
        <td>{renderableShare.userId}</td>
        <td>{renderableShare.channelName} ({renderableShare.channelId})</td>
        <td>
          <Link href={renderableShare.permalink} className="link-button" target="_blank"><i className="bi bi-link"></i>
          </Link>
        </td>
        <td>{renderableShare.replyCount}</td>
      </tr>
    )
  });
  return (
    <div>
      <p><strong>{link.url}</strong></p>
      <p>{link.title}</p>
      <h3>Shares</h3>
      <p>This list shows each time a Slack Message in a public channel that contains this link was sent.</p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Shared At</th>
            <th>Message TS</th>
            <th>User ID</th>
            <th>Channel ID</th>
            <th>Permlink</th>
            <th>Reply Count</th>
          </tr>
        </thead>
        <tbody>
          {sharesRows}
        </tbody>
      </table>
    </div>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <Layout>
      {page}
    </Layout>
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

  const link = await getLink(decodeURIComponent(ctx.query.url));
  const renderableShares = await listShares(decodeURIComponent(ctx.query.url));

  return {
    props: {
      hideDuration: true,
      username: sess ? sess.user.name : "Demo Mode",
      userId: sess ? sess.user.id : "",
      isSuperAdmin: sess ? sess.user.isSuperAdmin : false,
      link,
      renderableShares,
    },
  };
}
