import Navbar from "./navbar";
import Footer from "./footer";
import Head from "next/head";
import Link from "next/link";
import { titleCase } from "title-case";
import getConfig from 'next/config';
import * as React from "react";

const { publicRuntimeConfig } = getConfig();

export default function Layout(
  {
    children,
    currentPage,
    isReplicatedEnabled,
    isUpdateAvailable,
    slackernewsVersion,
  }
) {

  return (
    <>
      <Head>
        <title>SlackerNews: Admin</title>
      </Head>
      <div className="col-lg-8 mx-auto" style={{ width: "85%" }}>
        <Navbar slackernewsVersion={slackernewsVersion} username={children.props.username} hideFilter={true} />
        <div className="breadcrumbs">
          Home &raquo; Admin &raquo; {titleCase(currentPage)}
        </div>
        {isUpdateAvailable ? (
          <span>There is an update to SlackerNews available!</span>
        ) : null}
        <div className="body" style={{ display: "flex" }}>
          <div
            className="d-flex flex-column flex-shrink-0 p-3 bg-light"
            style={{ width: "280px" }}
          >
            <ul className="nav nav-pills flex-column mb-auto">
              <li className="nav-item">
                <Link href="/admin/content-mgmt" className={`nav-link ${
                      currentPage === "content-mgmt" ? "active" : "link-dark"
                    }`}
                  >
                    Content Mgmt
                </Link>
              </li>
              {/* TODO: Add the conent-rules page
                 <li>
                  <Link href="/admin/content-rules" className={`nav-link ${currentPage === "content-rules" ? "active" : "link-dark"}`}>
                      Content Rules
                  </Link>
                </li> */}
              <li>
                <Link href="/admin/members" className={`nav-link ${
                      currentPage === "members" ? "active" : "link-dark"
                    }`}
                  >
                    Members
                </Link>
              </li>
              <li>
                <Link href="/admin/departments" className={`nav-link ${
                      currentPage === "departments" ? "active" : "link-dark"
                    }`}
                  >
                    Departments
                </Link>
              </li>

              {isReplicatedEnabled &&
              <>
              <li>
                <Link href="/admin/updates" className={`nav-link ${
                      currentPage === "updates" ? "active" : "link-dark"
                    }`}
                    >
                    Updates
                </Link>
              </li>
              <li>
                <Link href="/admin/support-bundle" className={`nav-link ${
                      currentPage === "support" ? "active" : "link-dark"
                    }`}
                    >
                    Support Bundle
                </Link>
              </li>
              </>
              }
              <li>
                <Link href="/admin/admin-console" className={`nav-link ${
                      currentPage === "admin-console" ? "active" : "link-dark"
                    }`}
                  >
                    Admin Console
                </Link>
              </li>
              <li>
                <Link href="/admin/admin-notifications" className={`nav-link ${
                      currentPage === "admin-notifications"
                        ? "active"
                        : "link-dark"
                    }`}
                  >
                    Admin Notifications
                </Link>
              </li>
              <li>
                <Link href="/admin/integrations" className={`nav-link ${
                      currentPage === "integrations" ? "active" : "link-dark"
                    }`}
                  >
                    Integrations
                </Link>
              </li>
              <li>
                <Link href="/admin/slack" className={`nav-link ${
                      currentPage === "slack" ? "active" : "link-dark"
                    }`}
                  >
                    Slack
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/chrome-plugin" className={`nav-link ${
                      currentPage === "chrome-plugin" ? "active" : "link-dark"
                    }`}
                  >
                    Chrome Plugin
                </Link>
              </li>
            </ul>
          </div>
          <main style={{ paddingLeft: "24px", width: "100%" }}>{children}</main>
        </div>
        <i style={{fontSize: "12px", textAlign: "center"}}>Slackernews version {slackernewsVersion}</i>
        <Footer hideSearch={true} />
      </div>
    </>
  );
}

