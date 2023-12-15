import Navbar from "./navbar";
import Footer from "./footer";
import Head from "next/head";
import Link from "next/link";
import { titleCase } from "title-case";
import { Theme } from "@radix-ui/themes";
import '@radix-ui/themes/styles.css';

export function BreadCrumbs({currentPage, childPage}) {
  return (
    <div className="breadcrumbs">
      <Link href={"/"}>Home</Link>
      {' '}
      &raquo;
      {' '}
      <Link href={"/admin"}>Admin</Link>
      {' '}
      &raquo;
      {' '}
      {(!childPage) ? titleCase(currentPage) :
        <>
          <Link href={`/admin/${currentPage}`}>{titleCase(currentPage)}</Link>
          {' '}
          &raquo; {titleCase(childPage)}</>}
    </div>
  )

}

export default function Layout({children, currentPage, isReplicatedEnabled, isUpdateAvailable, childPage}) {

  return (
    <>
      <Head>
        <title>SlackerNews: Admin</title>
      </Head>
      <div className="col-lg-8 mx-auto" style={{width: "85%"}}>
        <Navbar username={children.props.username} hideFilter={true}/>
        {isUpdateAvailable ? (
          <span>There is an update to SlackerNews available!</span>
        ) : null}
        <BreadCrumbs currentPage={currentPage} childPage={childPage}/>
        <div className="body" style={{display: "flex"}}>
          <div
            className="d-flex flex-column flex-shrink-0 p-3 bg-light"
            style={{width: "280px"}}
          >
            <ul className="nav nav-pills flex-column mb-auto">
              <li className={"nav-item"}>
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
              <li className={"nav-item"}>
                <Link href="/admin/members" className={`nav-link ${
                  currentPage === "members" ? "active" : "link-dark"
                }`}
                >
                  Members
                </Link>
              </li>
              <li className={"nav-item"}>
                <Link href="/admin/departments" className={`nav-link ${
                  currentPage === "departments" ? "active" : "link-dark"
                }`}
                >
                  Departments
                </Link>
              </li>

              {isReplicatedEnabled &&
                <>
                  <li className={"nav-item"}>
                    <Link href="/admin/updates" className={`nav-link ${
                      currentPage === "updates" ? "active" : "link-dark"
                    }`}
                    >
                      Updates
                    </Link>
                  </li>
                  <li className={"nav-item"}>
                    <Link href="/admin/support-bundle" className={`nav-link ${
                      currentPage === "support" ? "active" : "link-dark"
                    }`}
                    >
                      Support Bundle
                    </Link>
                  </li>
                </>
              }
              <li className={"nav-item"}>
                <Link href="/admin/admin-console" className={`nav-link ${
                  currentPage === "admin-console" ? "active" : "link-dark"
                }`}
                >
                  Admin Console
                </Link>
              </li>
              <li className={"nav-item"}>
                <Link href="/admin/admin-notifications" className={`nav-link ${
                  currentPage === "admin-notifications"
                    ? "active"
                    : "link-dark"
                }`}
                >
                  Admin Notifications
                </Link>
              </li>
              <li className={"nav-item"}>
                <Link href="/admin/integrations" className={`nav-link ${
                  currentPage === "integrations" ? "active" : "link-dark"
                }`}
                >
                  Integrations
                </Link>
              </li>
              <li className={"nav-item"}>
                <Link href="/admin/slack" className={`nav-link ${
                  currentPage === "slack" ? "active" : "link-dark"
                }`}
                >
                  Slack
                </Link>
              </li>
              <li className={"nav-item"}>
                <Link href="/admin/chrome-plugin" className={`nav-link ${
                  currentPage === "chrome-plugin" ? "active" : "link-dark"
                }`}
                >
                  Chrome Plugin
                </Link>
              </li>
            </ul>
          </div>
          <main style={{paddingLeft: "24px", width: "100%"}}>
            <Theme
              accentColor="indigo"
              grayColor="sand"
              radius="large"
              scaling="95%"
            >
              {children}
            </Theme>
          </main>
        </div>
        <Footer hideSearch={true}/>
      </div>
    </>
  );
}

