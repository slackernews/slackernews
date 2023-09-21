import UnauthedLayout from "../../components/unauthed-layout";
import React, { useEffect, useState } from 'react';
import "../../styles/Login.module.css";
import LoginSlack from "../../components/login-slack";
import { getParam } from "../../lib/param";
import Link from "next/link";
import { useRouter } from 'next/router'

export default function Page({ slackRedirectUri, isUnconfigured }) {
  const router = useRouter();

  const onDemoModeClick = () => {
    router.push("/");
  }

  if (isUnconfigured) {
    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
            <div className="card border-0 shadow rounded-3 my-5">
              <div className="card-body p-4 p-sm-5" style={{backgroundColor: "rgb(246, 246, 239)"}}>
                <h1 className="card-title text-center mb-5 fw-light fs-5">SlackerNews</h1>
                <p className="slackernews-unconfigured">SlackerNews is not configured and will be running in Demo Mode.</p>
                <p className="slackernews-configure">
                  To configure SlackerNews, visit <Link href="/admin/slack">the admin panel</Link> OR provide Slack app configuration in the Admin Console configuration.
                </p>
                <div style={{textAlign: "center"}}>
                  <button type="submit" className="btn btn-primary" onClick={onDemoModeClick}>Enter the demo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
          <div className="card border-0 shadow rounded-3 my-5">
            <div className="card-body p-4 p-sm-5" style={{backgroundColor: "rgb(246, 246, 239)"}}>
              <h1 className="card-title text-center mb-5 fw-light fs-5">Slackernews</h1>
              <LoginSlack redirectUri={slackRedirectUri}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <UnauthedLayout>
      {page}
    </UnauthedLayout>
  );
}

export async function getServerSideProps(ctx) {
  const slackClientId = await getParam("SlackClientId");
  const teamId = await getParam("SlackTeamId");

  const slackAuthRedirectUri = encodeURI(process.env["SLACK_AUTH_REDIRECT_URI"]);

  console.log("slackAuthRedirectUri", slackAuthRedirectUri)
  let slackRedirectUri = `https://slack.com/openid/connect/authorize?scope=openid%20email%20profile&response_type=code&redirect_uri=${slackAuthRedirectUri}&client_id=${slackClientId}`;
  if (teamId) {
    slackRedirectUri += `&team=${teamId}`;
  }

  return {
    props: {
      slackRedirectUri,
      isUnconfigured: !slackClientId,
    }
  }
}
