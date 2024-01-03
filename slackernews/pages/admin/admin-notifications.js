import AdminLayout from "../../components/admin-layout";
import React, { useEffect, useState } from 'react';
import router, { useRouter } from 'next/router';
import { loadSession } from "../../lib/session";
import { ensureAdminNotificationChannel } from "../../lib/slack";
import cookies from 'next-cookies';
import { getAdminNotificationSettings } from "../../lib/param";
import envConfig from "../../lib/env-config";

export default function Page({ notificationsChannel, initialNotificationSettings, isReplicatedEnabled }) {
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings);

  const toggleNotificationSetting = async (key, enabled) => {
    try {
      const resp = await fetch(`/api/admin/notification`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: key,
          enabled: enabled,
        }),
      });

      const data = await resp.json();
      setNotificationSettings(data);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const notificationRows = notificationSettings.map((notificationSetting) => {
    return (
      <tr key={notificationSetting.key}>
        <td>{notificationSetting.description}</td>
        <td>
          <input
            type="checkbox"
            id={notificationSetting.key}
            checked={notificationSetting.enabled}
            onChange={toggleNotificationSetting.bind(this, notificationSetting.key, !notificationSetting.enabled)} />
        </td>
      </tr>
    );
  });

  return (
    <div className="admin-notifications">
      <p>
        Notifications will be sent to the #{notificationsChannel.name} channel.
      </p>
      <table>
        <thead>
          <tr>
            <th className="fw-bold">Description</th>
            <th className="fw-bold">Enabled</th>
          </tr>
        </thead>
        <tbody>
          {notificationRows}
        </tbody>
      </table>
    </div>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="admin-notifications"
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

  const adminChannel = await ensureAdminNotificationChannel();
  const adminNotificationSettings = await getAdminNotificationSettings();  
  const {isReplicatedEnabled, isKOTSManaged, showChromePluginTab} = envConfig();
  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
      notificationsChannel: adminChannel,
      initialNotificationSettings: adminNotificationSettings,
      isReplicatedEnabled,
      isKOTSManaged,
      showChromePluginTab,
    },
  };
}
