import AdminLayout from "../../components/admin-layout";
import React from 'react';
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';

export default function Page({ isHelm, namespace , isReplicatedEnabled}) {

  return (
    <div className="admin-console">
      <h1>Connect to the Admin Console</h1>
      <p>
        If you have <code>kubectl</code> to the Kubernetes cluster that
        you&apos;re running SlackerNews on, you can also access a lower
        level admin console.
      </p>
      <h3>Run the following command to access the admin console:</h3>
      <pre>
        kubectl -n {namespace} port-forward svc/kotsadm 8800:80
      </pre>
      <h3 className="admin-console-link">visit http://localhost:8800</h3>
      <h2>With the Admin Console, you can:</h2>
      <ul>
        <li>Manage update frequency</li>
        <li>Read release notes</li>
        <li>Generate support bundles</li>
        <li>Adjust environment configuration</li>
      </ul>
    </div>
  )
}

Page.getLayout = function getLayout(page) {
  console.log(page,'page')

  return (
    <AdminLayout currentPage="admin-console" slackernewsVersion={page.props.slackernewsVersion} isReplicatedEnabled={page.props.isReplicatedEnabled}>
      {page}
    </AdminLayout>
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

  let namespace = process.env["KUBERNETES_NAMESPACE"];
  if (!namespace) {
    namespace = "default";
  }

  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
      isHelm: process.env["INSTALL_METHOD"] === "helm",
      namespace,
      slackernewsVersion: process.env["SLACKERNEWS_VERSION"],
      isReplicatedEnabled,
    },
  };
}
