import AdminLayout from "../../components/admin-layout";
import React, { useEffect, useState } from "react";
import router, { useRouter } from "next/router";
import {
  listUsers,
  listDailyActiveUsers,
  listMonthlyActiveUsers,
} from "../../lib/user";
import { listWorkspaceUsers } from "../../lib/slack";
import { loadSession } from "../../lib/session";
import cookies from "next-cookies";
import Link from "next/link";
import {
  faSortDown,
  faSortUp,
  faCircleInfo,
  faFilter,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import { ReplicatedClient } from "../../lib/replicated-sdk";
import Image from "next/image";

export default function Page({
  initialUsers,
  initialWorkspaceUsers,
  dailyUsers,
  monthlyUsers,
  memberCountMax,
  isReplicatedEnabled,
}) {
  const [filterUsers, setFilterUsers] = useState({
    current: true,
    admin: true,
    slack: true,
    guest: false,
  });
  const [users, setUsers] = useState(initialUsers);
  const [workspaceUsers, setWorkspaceUsers] = useState(initialWorkspaceUsers);

  const onChangeFilterUsers = (filter, ev) => {
    const f = { ...filterUsers };
    f[filter] = !f[filter];
    setFilterUsers(f);

    fetchAllUsers(f);
  };

  const fetchAllUsers = async (filters) => {
    await fetchUsers(filters);
    await fetchWorkspaceUsers(filters);
  };

  const fetchUsers = async (filters) => {
    try {
      const resp = await fetch(`/api/users`);
      const data = await resp.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkspaceUsers = async (filters) => {
    const include = [];
    if (filters.slack) {
      include.push("slack");
    }
    if (filters.guest) {
      include.push("guest");
    }

    try {
      const resp = await fetch(`/api/slack/users?include=${include.join(",")}`);
      const data = await resp.json();
      setWorkspaceUsers(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  function monthName(monthNumber) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[monthNumber];
  }

  function shortDate(date) {
    return `${monthName(
      date.getMonth(),
    )} ${date.getDate()}, ${date.getFullYear()}`;
  }

  let allUsers = users.concat([]);
  for (let i = 0; i < workspaceUsers.length; i++) {
    const workspaceUser = workspaceUsers[i];
    const user = allUsers.find((u) => u.id === workspaceUser.id);
    if (!user && workspaceUser) {
      allUsers.push(workspaceUser);
    }
  }

  const onRemoveClick = async (id) => {};

  const onMakeAdminOrUserClick = async (id, isAdmin) => {
    try {
      const resp = await fetch(`/api/users/${id}/admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAdmin: isAdmin,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        fetchAllUsers(filterUsers);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const sortedUsers = allUsers.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });

  const rows = sortedUsers.map((user, i) => {
    return (
      <tr
        key={user.id}
        className={`member-${user.createdAt ? "current" : "slack"}`}
      >
        <td style={{ width: "80px" }}>
          <Image
            src={user.avatarUrl}
            width="32"
            height="32"
            alt={`icon of ${user.name}`}
          />
        </td>
        <td>
          <strong>{user.createdAt ? user.name : user.realName}</strong>
          <br />
          {user.email}
        </td>
        <td>
          {user.createdAt
            ? user.isSuperAdmin
              ? "Super Admin"
              : "Member"
            : "Slack User"}
        </td>
        <td>{user.createdAt ? shortDate(new Date(user.lastActiveAt)) : ""}</td>
        <td>
          {!user.createdAt ? (
            "Invite"
          ) : (
            <OverlayTrigger
              trigger="click"
              rootClose={true}
              placement="left-start"
              overlay={
                <Popover id="popover-filters">
                  <Popover.Body style={{ padding: "2px" }}>
                    <ListGroup variant="flush">
                      <ListGroup.Item
                        action
                        onClick={onMakeAdminOrUserClick.bind(
                          this,
                          user.id,
                          !user.isSuperAdmin,
                        )}
                      >
                        {user.isSuperAdmin ? "Make User" : "Make Admin"}
                      </ListGroup.Item>
                      <ListGroup.Item
                        action
                        onClick={onRemoveClick.bind(this, user.id)}
                      >
                        Remove
                      </ListGroup.Item>
                    </ListGroup>
                  </Popover.Body>
                </Popover>
              }
            >
              <Button variant="outline-secondary" size="sm">
                <FontAwesomeIcon icon={faEllipsis} />
              </Button>
            </OverlayTrigger>
          )}
        </td>
      </tr>
    );
  });

  return (
    <div>
      <div style={{ display: "flex" }}>
        <div className="large-stat">
          <span className="large-number">{users.length}</span>
          <span className="small-number"> / {workspaceUsers.length}</span>
          <br />
          <span className="muted">members</span>
          <br />
          <span>Your license allows for {memberCountMax} maximum members</span>
        </div>
        <div className="large-stat">
          <span className="large-number">{dailyUsers}</span>
          <br />
          <span className="muted">DAU</span>
        </div>
        <div className="large-stat">
          <span className="large-number">{monthlyUsers}</span>
          <br />
          <span className="muted">MAU</span>
        </div>
      </div>

      <div className="d-flex flex-row-reverse">
        <OverlayTrigger
          trigger="click"
          placement="bottom"
          rootClose={true}
          overlay={
            <Popover id="popover-filters">
              <Popover.Header as="h3">Filter users</Popover.Header>
              <Popover.Body>
                <Form.Group controlId="filterUsersCurrent">
                  <Form.Check
                    type="checkbox"
                    label="Current Users"
                    checked={filterUsers.current}
                    onChange={onChangeFilterUsers.bind(this, "current")}
                  />
                </Form.Group>
                <Form.Group controlId="filterUsersAdmin">
                  <Form.Check
                    type="checkbox"
                    label="Super Admins"
                    checked={filterUsers.admin}
                    onChange={onChangeFilterUsers.bind(this, "admin")}
                  />
                </Form.Group>
                <Form.Group controlId="filterUsersSlack">
                  <Form.Check
                    type="checkbox"
                    label="Slack Accounts"
                    checked={filterUsers.slack}
                    onChange={onChangeFilterUsers.bind(this, "slack")}
                  />
                </Form.Group>
                <Form.Group controlId="filterUsersGuests">
                  <Form.Check
                    type="checkbox"
                    label="Slack Guests"
                    checked={filterUsers.guest}
                    onChange={onChangeFilterUsers.bind(this, "guest")}
                  />
                </Form.Group>
              </Popover.Body>
            </Popover>
          }
        >
          <Button variant="outline-secondary" size="sm">
            <FontAwesomeIcon icon={faFilter} />
          </Button>
        </OverlayTrigger>
      </div>

      <table className="members-table">
        <thead>
          <tr>
            <th colSpan="2">
              Name <FontAwesomeIcon icon={faSortDown} />
            </th>
            <th>Type</th>
            <th>
              Last Activity <FontAwesomeIcon icon={faCircleInfo} />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

Page.getLayout = function getLayout(page) {
  return (
    <AdminLayout currentPage="members" {...page.props}>
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

  const slackernewsUsers = await listUsers();

  let workspaceUsers = [];
  try {
    workspaceUsers = await listWorkspaceUsers(true, false);
  } catch (err) {
    console.log("error listing workspace users", err);
  }

  const dailyUsers = await listDailyActiveUsers();
  const monthlyUsers = await listMonthlyActiveUsers();
  const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";
  //TODO: Pass this value from helm chart in for non-sdk installs
  const memberCountMax = isReplicatedEnabled
    ? (await ReplicatedClient.getEntitlement("member_count_max")).value
    : 9999;

  return {
    props: {
      initialUsers: slackernewsUsers,
      initialWorkspaceUsers: workspaceUsers,
      dailyUsers: dailyUsers.length,
      monthlyUsers: monthlyUsers.length,
      username: sess.user.name,
      hideDuration: true,
      memberCountMax: memberCountMax,
      slackernewsVersion: process.env["SLACKERNEWS_VERSION"],
      isReplicatedEnabled,
    },
  };
}
