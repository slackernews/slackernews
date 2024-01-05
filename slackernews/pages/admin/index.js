import React, { useEffect, useState } from 'react';
import cookies from 'next-cookies';
import Layout from '../../components/layout';
import { loadSession } from '../../lib/session';


export default function Page({isReplicatedEnabled }) {
  return (
 <>
 </>
  )

}

Page.getLayout = function getLayout(page) {
  return (
    <Layout slackernewsVersion={page.props.slackernewsVersion} isReplicatedEnabled={page.props.isReplicatedEnabled}>
      {page}
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const c = cookies(ctx);
  const sess = await loadSession(c.auth); 
   const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";

  if (!sess) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props:{
        slackernewsVersion: process.env["SLACKERNEWS_VERSION"],
        isReplicatedEnabled,
      },
    };
  }

  return {
    redirect: {
      permanent: false,
      destination: "/admin/members",
    },
    props:{
      slackernewsVersion: process.env["SLACKERNEWS_VERSION"],
      isReplicatedEnabled,
    },
  };
}
