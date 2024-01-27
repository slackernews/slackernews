import React, { useEffect, useState } from 'react';
import cookies from 'next-cookies';
import Layout from '../../components/layout';
import { loadSession } from '../../lib/session';
import envConfig from "../../lib/env-config";


export default function Page({isReplicatedEnabled, isKOTSManaged}) {
  return (
 <>
 </>
  )

}

Page.getLayout = function getLayout(page) {
  return (
    <Layout slackernewsVersion={page.props.slackernewsVersion}
            isReplicatedEnabled={page.props.isReplicatedEnabled}
            isKOTSManaged={page.props.isKOTSManaged}>
      {page}
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const c = cookies(ctx);
  const sess = await loadSession(c.auth); 
  const {isReplicatedEnabled, isKOTSManaged, showChromePluginTab, slackernewsVersion} = envConfig();

  if (!sess) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props: {
        isReplicatedEnabled,
        isKOTSManaged,
        showChromePluginTab,
        slackernewsVersion,
      },
    };
  }

  return {
    redirect: {
      permanent: false,
      destination: "/admin/members",
    },
    props:{
      slackernewsVersion,
      isReplicatedEnabled,
    },
  };
}
