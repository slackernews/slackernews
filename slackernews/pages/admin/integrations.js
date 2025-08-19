import React, { useState } from "react";
import { loadSession } from "../../lib/session";
import { listIntegrations } from "../../lib/integration";
import AdminLayout from "../../components/admin-layout";
import cookies from "next-cookies";
import Link from "next/link";
import Toggle from "react-toggle";
import "react-toggle/style.css"; // for ES6 modules
import Image from "next/image";
import envConfig from "../../lib/env-config";

export default function Page({initialIntegrations, isReplicatedEnabled}) {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  const cards = integrations.map((integration) => {
    return (
      <div key={integration.id} className="col-sm-6 col-lg-4 mb-1">
        <div className="card">
          <div className="card-body">
            <div className="mb-2">
            <Image
              src={`data:image/png;base64,${integration.icon}`}
              width="30"
              height="30"
              alt={integration.title}
            />

            <label style={{marginBottom: 0, marginLeft: "10px"}}>
              {integration.title}
            </label>
          </div>
          <div className="mb-2">
            <Link href={`/admin/integrations/${integration.id}`} className="btn btn-outline-secondary me-1">Configure
            </Link>
            <Link
              href={`https://docs.slackernews.io/integrations/${integration.id}`}
              className="btn btn-outline-secondary">Docs
            </Link>
          </div>
          <div>
            <Toggle
                id={`integration-${integration.id}-enabled`}
                onChange={async (ev) => {
                  // API request to enable the integration
                  try {
                    const res = await fetch(
                      `/api/admin/integration/${integration.id}/enabled`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({enabled: ev.target.checked}),
                      },
                    );

                    if (res.status === 204) {
                      // Update the state
                      const updatedIntegrations = integrations.map((i) => {
                        if (i.id === integration.id) {
                          i.is_enabled = !i.is_enabled;
                        }
                        return i;
                      });
                      setIntegrations(updatedIntegrations);
                      return;
                    }

                    if (res.status === 409) {
                      // config missing
                      alert(
                        "You must configure this integration before enabling it.",
                      );
                      return;
                    }

                    alert("Error enabling integration");
                  } catch (err) {
                    console.log(err);
                  }
                }}
                checked={integration.is_enabled}
              />
              <p className={"mx-1 mb-0"}>{integration.version}</p>
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <>
      <h1>Integrations</h1>
      <p>Configuring and connecting Integrations improves the ability to fetch preview and icon data for
        links.</p>
      <div className="row">{cards}</div>
    </>
  );
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout
      currentPage="integrations"
      slackernewsVersion={page.props.slackernewsVersion}
      isReplicatedEnabled={page.props.isReplicatedEnabled}
      isKOTSManaged={page.props.isKOTSManaged}
      showChromePluginTab={page.props.showChromePluginTab}
    >
      {page}
    </AdminLayout>
  );
};

export async function getServerSideProps(ctx) {
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

  const integrations = await listIntegrations();
  const {isReplicatedEnabled, isKOTSManaged, showChromePluginTab, slackernewsVersion} = envConfig();


  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
      initialIntegrations: integrations,
      slackernewsVersion,
      isReplicatedEnabled,
      isKOTSManaged,
      showChromePluginTab,
    },
  };
}
