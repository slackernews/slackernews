import Layout from "../components/layout";
import LinkRow from "../components/link-row";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import cookies from 'next-cookies';
import "../styles/Home.module.css";
import { loadSession } from "../lib/session";
import { listTopLinks } from "../lib/link";
import { getParam } from "../lib/param";
import { listAvailableUserGroups, listUsersInUserGroup } from "../lib/slack";
import envConfig from "../lib/env-config";

export default function Page({ renderableLinks, nextPageUrl, startCount, isSuperAdmin, isDebugMode }) {
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
    return (
      <LinkRow
        key={renderableLink.link.url}
        rowNumber={startCount+i}
        renderableLink={renderableLink}
        onEdited={onEdited}
        isEditable={isSuperAdmin} />
    );
  });

  return (
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
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <Layout >
      {page}
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const c = cookies(ctx);
  const sess = await loadSession(c.auth);
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

  const duration = ctx.query.t ? ctx.query.t : "7d";
  const page = ctx.query.p ? ctx.query.p : "1";
  const query = ctx.query.q ? ctx.query.q : "";
  const depart = ctx.query.depart ? ctx.query.depart : "all";
  const userIds = depart === "all" ? [] : await listUsersInUserGroup(depart);
  const renderableLinks = await listTopLinks(duration, page, sess ? sess.user.id : "", userIds, false, query);
  const departments = await listAvailableUserGroups();

  const nextPageUrl = renderableLinks.length === 30 ?
    ctx.query.t ?
      `/?t=${duration}&p=${parseInt(page) + 1}` :
      `/?p=${parseInt(page) + 1}`
    : null;

  const {showChromePluginTab} = envConfig();


  return {
    props: {
      renderableLinks,
      departments,
      depart,
      hasNextPage: renderableLinks.length === 30,
      nextPageUrl: nextPageUrl ? nextPageUrl : "",
      startCount: (parseInt(page) - 1) * 30 + 1,
      username: sess ? sess.user.name : "Demo Mode",
      userId: sess ? sess.user.id : "",
      duration: duration,
      isSuperAdmin: sess ? sess.user.isSuperAdmin : false,
      showChromePluginTab,
    },
  };
}
