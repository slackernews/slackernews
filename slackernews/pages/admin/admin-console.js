import AdminLayout from "../../components/admin-layout";
import React from 'react';
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import { Link, Text, Flex } from "@radix-ui/themes";

export function Code({children}) {
  return (
    <code style={{color: "var(--gray-12)", background: "var(--gray-4)", padding: "5px"}}>
      {children}
    </code>
  )
}

export default function Page({isHelm, namespace, isReplicatedEnabled}) {

  return (
    <Flex direction="column" gap="2">
      <h1>Connect to the Admin Console</h1>
      <Text>
        If you have <Code>kubectl</Code> access to the Kubernetes cluster
        that
        you&apos;re running SlackerNews on, you can also access a lower
        level admin console.
      </Text>
      <h5>Run the following command to access the admin console:</h5>
      <Code>
        kubectl -n {namespace} port-forward svc/kotsadm 8800:80
      </Code>
      <Text>Then visit <Link href={"http://localhost:8800"}>http://localhost:8800</Link> to access the
        console.</Text>
      <h5>With the Admin Console, you can:</h5>
      <ul>
        <li>Manage update frequency</li>
        <li>Read release notes</li>
        <li>Generate support bundles</li>
        <li>Adjust environment configuration</li>
      </ul>
    </Flex>
  )
}

Page.getLayout = function getLayout(page) {
  console.log(page, 'page')

  return (
    <AdminLayout currentPage="admin-console" isReplicatedEnabled={page.props.isReplicatedEnabled}>
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
      isReplicatedEnabled
    },
  };
}
