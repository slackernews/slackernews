import AdminLayout from "../../components/admin-layout";
import React, { useState } from "react";
import { loadSession } from "../../lib/session";
import { listIntegrations } from "../../lib/integration";
import cookies from "next-cookies";
import Link from "next/link";
import Toggle from "react-toggle";
import "react-toggle/style.css"; // for ES6 modules
import Image from "next/image";
import { Flex, Text, Switch } from "@radix-ui/themes";

export default function Page({initialIntegrations, isReplicatedEnabled}) {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  const cards = integrations.map((integration) => {
    return (
      <div key={integration.id} className="col-sm-4">
        <div className="card">
          <Flex className="card-body" direction="column" gap="3">
            <Flex direction="row" align="center">
              <Image
                src={`data:image/png;base64,${integration.icon}`}
                width="30"
                height="30"
                alt={integration.title}
              />

              <h5 style={{marginBottom: 0, marginLeft: "10px"}}>
                {integration.title}
              </h5>
            </Flex>
            <Flex direction="row" gap="1">
              <Link href={`/admin/integrations/${integration.id}`} className="btn btn-outline-secondary">Configure
              </Link>
              <Link
                href={`https://docs.slackernews.io/integrations/${integration.id}`}
                className="btn btn-outline-secondary">Docs
              </Link>
            </Flex>
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
            <Flex direction="row" grow="1" gap="5">
              <label htmlFor={`integration-${integration.id}-enabled`}>
                Enabled
              </label>
              <p>{integration.version}</p>
            </Flex>
          </Flex>
        </div>
      </div>
    );
  });

  return (
    <>
      <h1>Integrations</h1>
      <Text>Configuring and connecting Integrations improves the ability to fetch preview and icon data for
        links.</Text>
      <div className="row">{cards}</div>
    </>
  );
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout
      currentPage="integrations"
      isReplicatedEnabled={page.props.isReplicatedEnabled}
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
  const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";

  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
      initialIntegrations: integrations,
      isReplicatedEnabled,
    },
  };
}
