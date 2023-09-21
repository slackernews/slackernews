import React from 'react';
import { getUserKarma, listUsers } from "../../lib/user";
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import Layout from "../../components/layout";
import { listUserLinks } from "../../lib/link";
import LinkRow from "../../components/link-row";
import moment from 'moment';
import { getSlackUser } from '../../lib/slack';

export default function Page({ slackUser, user, userLinks, karma }) {
  const startCount = 1;
  const rows = userLinks.map((userLink, i) => {
    return <LinkRow
      key={userLink.link.url}
      rowNumber={startCount+i}
      renderableLink={userLink}
      isEditable={false} />;
  });

  return (
    <div>
      <table>
        <tbody>
          <tr>
            <td>user:</td>
            <td>{slackUser.fullName}</td>
          </tr>
          <tr style={{display: `${user ? "" : "none"}`}}>
            <td>created:</td>
            <td>{user ? moment(user.createdAt).format("LL") : null}</td>
          </tr>
          <tr>
            <td>karma:</td>
            <td>{karma}</td>
          </tr>
          <tr>
            <td>about:</td>
            <td>todo</td>
          </tr>
        </tbody>
      </table>
      <h3>Contributed links:</h3>
      <table className="table">
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <Layout>
      {page}
    </Layout>
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

  const page = ctx.query.p ? ctx.query.p : "1";

  const slackUser = await getSlackUser(ctx.query.id);
  const userLinks = await listUserLinks(ctx.query.id, page, sess.user.id);

  let user;
  const allUsers = await listUsers();
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].id === slackUser.id) {
      user = allUsers[i];
      break;
    }
  }

  const karma = await getUserKarma(ctx.query.id);

  return {
    props: {
      username: sess.user.name,
      slackUser: slackUser,
      user: user ? user : null,
      userLinks: userLinks,
      karma: karma,
    },
  };
}
