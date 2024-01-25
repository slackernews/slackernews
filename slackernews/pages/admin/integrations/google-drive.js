import AdminLayout from "../../../components/admin-layout";
import React, { useEffect, useState } from 'react';
import router, { useRouter } from 'next/router';
import { loadSession } from "../../../lib/session";
import cookies from 'next-cookies';
import Link from "next/link";

export default function Page({ isHelm, namespace }) {

  return (
    <>
      <h1>Google Drive</h1>
      <div>
        <p>When enabled, SlackerNews will automatically update document titles for Google docs, sheets, slides, and
          forms.</p>
        <a href="https://docs.slackernews.io/integrations/google-drive">Docs</a>
        <form>
          <div className="form-group">
            <label htmlFor="googleDriveFolderId">Folder ID</label>
            <input type="text" className="form-control" id="googleDriveFolderId" placeholder="Enter folder ID" />
          </div>
        </form>
      </div>
    </>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="integrations"
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

  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
    },
  };
}
