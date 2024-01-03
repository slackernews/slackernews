import AdminLayout from "../../components/admin-layout";
import React, { useEffect, useState } from 'react';
import router, { useRouter } from 'next/router';
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import { getChromePluginConfig } from "../../lib/param";
import envConfig from "../../lib/env-config";

export default function Page({isEnabled, token, showChromePluginTab}) {
  const [enabled, setEnabled] = useState(isEnabled);
  const [pluginToken, setPluginToken] = useState(token);

  if (!showChromePluginTab) {
    // don't let them go there until this feature is ready
    router.push("/admin");
  }

  return (

    <div className="chrome-plugin">
      <h1>Configure the SlackerNews Chrome Plugin</h1>
      <p>
        The SlackerNews Chrome Plugin allows you to ...
      </p>
      <input type="checkbox" id="isEnabled" checked={enabled} onChange={ () => {
        setEnabled(!enabled);
      }} />
      <label htmlFor="isEnabled">Enable Chrome Plugin</label>
      <br /><br />
      <div className={enabled ? null : "hidden"}>
        <p>Use this token in the Chrome Plugin Config</p>
        <input type="text" value={pluginToken} style={{minWidth: "500px"}} disabled />
      </div>
    </div>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="chrome-plugin"
                 isReplicatedEnabled={page.props.isReplicatedEnabled}
                 showChromePluginTab={page.props.showChromePluginTab}
                 isKOTSManaged={page.props.isKOTSManaged}
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

  const chromePluginConfig = await getChromePluginConfig();
  const {isReplicatedEnabled, isKOTSManaged, showChromePluginTab} = envConfig();


  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
      isEnabled: chromePluginConfig.enabled,
      token: chromePluginConfig.token,
      isReplicatedEnabled,
      isKOTSManaged,
      showChromePluginTab,
    },
  };
}
