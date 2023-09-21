import React, { useEffect, useState } from 'react';
import * as url from "url";
import { useRouter } from 'next/router'
import * as jwt from "jsonwebtoken";
import Cookies from 'cookies';
import { createSession, getToken } from '../../lib/session';
import { getOrCreateUser } from '../../lib/user';
import { getParam } from '../../lib/param';
import { getOrCreateSlackUser } from '../../lib/slack';

export default function LoginCallback() {
  const router = useRouter();

  return (
    <>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const code = ctx.query.code;

  const body = [];
  body.push(`code=${encodeURIComponent(code)}`);
  body.push(`client_id=${encodeURIComponent(await getParam("SlackClientId"))}`);
  body.push(`client_secret=${encodeURIComponent(await getParam("SlackClientSecret"))}`);

  let response = await fetch(`https://slack.com/api/openid.connect.token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.join("&"),
  });

  const data = await response.json();
  if (!data.ok) {
    console.log(data);
    console.error(`received invalid (!data.ok) response from slack`);
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props:{},
    };
  }

  // ensure that the slack account was
  // one one the team we are using
  response = await fetch(`https://slack.com/api/team.info`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
    },
  });

  const teamInfoData = await response.json();

  // TODO
  const slackClaims = await jwt.decode(data.id_token);

  const slackTeamId = slackClaims["https://slack.com/team_id"];
  if (slackTeamId !== teamInfoData.team.id) {
    console.error(`slack team id mismatch, wanted ${teamInfoData.team.id} but got ${slackTeamId}`);
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props:{},
    };
  }

  const accessToken = data.access_token;

  console.log(`slackClaims: ${JSON.stringify(slackClaims)}`);

  const slackUserId = slackClaims["https://slack.com/user_id"];
  const slackEmailAddress = slackClaims["email"];
  const slackName = slackClaims["name"];
  const slackAvatar = slackClaims["picture"];

  const slackUser = await getOrCreateSlackUser(slackUserId, slackEmailAddress, slackName, slackName, slackAvatar);
  const user = await getOrCreateUser(slackUserId, slackEmailAddress, slackName, slackAvatar);
  const sess = await createSession(user.id, accessToken);
  const token = await getToken(sess);
  const cookies = new Cookies(ctx.req, ctx.res)

  cookies.set('auth', token, {
    httpOnly: true,
  });

  return {
    redirect: {
      permanent: false,
      destination: "/",
    },
    props: {},
  }
}
