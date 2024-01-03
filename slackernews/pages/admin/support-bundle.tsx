import React from "react";
import AdminLayout from "../../components/admin-layout";
import { CopyBlock, dracula } from "react-code-blocks";
import Link from "next/link";
import cookies from "next-cookies";
import { loadSession } from "../../lib/session";

export default function Page({
  isReplicatedEnabled,
}: {
  isReplicatedEnabled: boolean;
}) {
  const supportBundlePluginCmd = "curl https://krew.sh/support-bundle | bash";
  const collectSupportBundleCmd = "kubectl support-bundle --load-cluster-specs";
  return (
    <div style={{ maxWidth: "800px" }}>
      <p className="h4">Collect a support bundle</p>
      <p>
        If you are having trouble with SlackerNews, the first step is to collect
        a support bundle and have it run through our prepackaged analyzers to
        help you troubleshoot.
      </p>
      <p className="h6">
        The easiest way to get a support bundle from the CLI-tooling:
      </p>
      <div
        className="d-flex flex-column"
        style={{ gap: "24px", maxWidth: "600px" }}
      >
        <div>
          <p style={{ fontSize: "16px", fontWeight: "bold" }}>
            1. Install support-bundle plugin
          </p>

          <CopyBlock
            text={supportBundlePluginCmd}
            language={"text"}
            showLineNumbers={false}
            wrapLines
            // @ts-ignore
            theme={dracula}
            codeBlock
          />
        </div>

        <div>
          <p style={{ fontSize: "16px", fontWeight: "bold" }}>
            2. Collect support bundle
          </p>
          <CopyBlock
            text={collectSupportBundleCmd}
            language={"text"}
            showLineNumbers={false}
            wrapLines
            // @ts-ignore
            theme={dracula}
            codeBlock
          />
        </div>
      </div>
      <hr />
      <p className="h4">Community-based Support</p>
      <p>
        SlackerNews is open source, to get help you can join our{" "}
        <Link href="https://github.com/orgs/slackernews/discussions/">
          Github Discussion
        </Link>
        .
        <br />
        If you find an issue with the application you can{" "}
        <Link href="https://github.com/slackernews/slackernews/issues/new">
          create an issue
        </Link>
        .
      </p>
    </div>
  );
}
Page.getLayout = function getLayout(page: any) {
  return (
    <AdminLayout
      currentPage="support"
      isUpdateAvailable={undefined}
      isReplicatedEnabled={page.props.isReplicatedEnabled}
      childPage={null} // cmon tsx
    >
      {page}
    </AdminLayout>
  );
};

export async function getServerSideProps(ctx: {
  req?: { headers: { cookie?: string | undefined } } | undefined;
}) {
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

  if (sess) {
    if (typeof sess?.user != "undefined" && !sess?.user.isSuperAdmin) {
      return {
        redirect: {
          permanent: false,
          destination: "/",
        },
        props: {},
      };
    }

    const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";

    return {
      props: {
        isReplicatedEnabled,
      },
    };
  }
}
