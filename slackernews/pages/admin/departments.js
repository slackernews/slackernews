import AdminLayout from "../../components/admin-layout";
import { loadSession } from "../../lib/session";
import cookies from 'next-cookies';
import Table from 'react-bootstrap/Table';
import React, { useState } from 'react';
import { listUserGroupsFromDB } from "../../lib/link";
import { listUserGroupsFromSlack } from "../../lib/slack";

export default function Page({ initialDepartments ,isReplicatedEnabled}) {
  const [departments, setDepartments] = useState(initialDepartments);
  const userGroups = departments.map(depart => {
    return (
      <tr key={depart.id}>
        <td>{depart.name}</td>
        <td>{depart.description}</td>
        <td>{depart.userCount}</td>
        <td><input type="checkbox" id={depart.id} checked={depart.isExcluded} onChange={async (ev) => {
          try {
            const res = await fetch(`/api/admin/usergroup/${depart.id}/exclude`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ id: depart.id, name: depart.name, isExcluded: ev.target.checked }),
            });
            console.log(res);
            if (res.status == 200) {
              // Update the state
              const updatedDepartments = departments.map((i) => {
                if (i.id === depart.id) {
                  i.isExcluded = !i.isExcluded;
                }
                return i;
              });
              setDepartments(updatedDepartments);
            } else {
              alert("Error handling departments");
            }
          } catch (err) {
            console.log(err);
          }
        }}/></td>
      </tr>
    )
  });

  return (
    <div>
      <p>By default all active user groups show up as a departments filter. You can exclude a user group to prevent it from showing as a department filter. 
      When a department filter is applied, only links submitted by the users in that group will be displayed.</p>

      <p>User Groups:</p>
      <Table  bordered>
        <thead>
          <tr>
            <th className="fw-bold">Display name</th>
            <th className="fw-bold">Description</th>
            <th className="fw-bold"># of members</th>
            <th className="fw-bold">Exclude</th>
          </tr>
        </thead>
        <tbody>
          {userGroups}
        </tbody>
      </Table>
    </div>
  )
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="departments" slackernewsVersion={page.props.slackernewsVersion} isReplicatedEnabled={page.props.isReplicatedEnabled}>
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

  const userGroupsFromSlack = await listUserGroupsFromSlack();
  const userGroupsFromDB = await listUserGroupsFromDB();
  userGroupsFromSlack.forEach(ug => {
    const userGroupDB = userGroupsFromDB.find(ugDB => ugDB.id === ug.id);
    if (userGroupDB !== undefined) {
      ug.isExcluded = userGroupDB.isExcluded
    } else {
      ug.isExcluded = false
    }
  });
  const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";

  return {
    props: {
      username: sess.user.name,
      hideDuration: true,
      initialDepartments: userGroupsFromSlack,
      slackernewsVersion: process.env["SLACKERNEWS_VERSION"],
      isReplicatedEnabled
    },
  };
}
