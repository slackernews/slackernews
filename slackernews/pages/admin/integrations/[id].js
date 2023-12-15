import AdminLayout from "../../../components/admin-layout";
import React, { useEffect, useState } from 'react';
import router, { useRouter } from 'next/router';
import { loadSession } from "../../../lib/session";
import cookies from 'next-cookies';
import Link from "next/link";
import { getIntegration } from "../../../lib/integration";

import validator from "@rjsf/validator-ajv6";
import Form from "@rjsf/core";

export default function Page({integration}) {
  return (
    <>
      <h1>{integration.title}</h1>
      <div>
        <p>description here</p>
        <a href={`https://docs.slackernews.io/integrations/${integration.id}`}>Docs</a>
        <Form
          schema={JSON.parse(integration.schema)}
          validator={validator}
          formData={JSON.parse(integration.config)}
          onSubmit={async (ev) => {
            try {
              const res = await fetch(`/api/admin/integration/${integration.id}/config`, {
                method: 'PUT',
                body: JSON.stringify(ev.formData),
              });

              if (res.status === 204) {
                alert('Configuration saved');
                return;
              }
            } catch (err) {
              console.log(err);
            }
          }}/>
      </div>
    </>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="integrations" childPage={page.props.integration.id}>
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

  const integration = await getIntegration(ctx.query.id);
  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
      integration,
    },
  };
}
