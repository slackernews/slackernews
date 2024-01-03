import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin-layout";
import Link from "next/link";
import cookies from "next-cookies";
import { loadSession } from "../../lib/session";
import { ReplicatedClient } from "../../lib/replicated-sdk";
import Modal from "react-modal";
import { CopyBlock, dracula } from "react-code-blocks";
import moment from "moment";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faCaretUp,
  faArrowsRotate,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { VersionHistory, Release } from "../../lib/replicated-sdk";

type Updates = {
  versionLabel: string;
  createdAt: string;
  releaseNotes: string;
};

type Props = {
  appInfo: { currentRelease: Release; appSlug: string };
  updates: Updates[];
  loginCmd: string;
  installPreflightCmd: string;
  preflightCmd: string;
  upgradeCmd: string;
  isReplicatedEnabled: boolean;
  versionHistory: VersionHistory;
};
const titleStyles = {
  fontWeight: 700,
  fontSize: "22px",
};
const customStyles = {
  content: {
    maxWidth: "1200px",
    minWidth: "500px",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

export default function Page({
  appInfo,
  updates,
  loginCmd,
  installPreflightCmd,
  preflightCmd,
  upgradeCmd,
  isReplicatedEnabled,
  versionHistory,
}: Props) {
  const [modalIsOpen, setModalOpen] = useState(false);
  const [releaseNoteModal, setReleaseNoteModal] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isShowingMoreReleases, setShowMoreReleases] = React.useState(false);
  const [lastUpdatedDate, setLastUpdatedDate] = useState(new Date());
  const [minutesPassed, setMinutesPassesd] = useState(0);
  const refreshData = () => {
    router.replace(router.asPath);
    setIsRefreshing(true);
    // setLastUpdatedDate(new Date());
    // setMinutesPassesd(0);
  };
  useEffect(() => {
    setIsRefreshing(false);
  }, [updates]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      let min = Math.floor(
        (new Date().getTime() - lastUpdatedDate.getTime()) / (1000 * 60),
      );
      setMinutesPassesd(min);
    }, 60000); // update every minute

    return () => clearInterval(intervalId);
  }, [updates]);

  const renderLastUpdated = () => {
    if (minutesPassed < 1) {
      return "now";
    } else if (minutesPassed === 1) {
      return "1 minute ago";
    } else {
      return `${minutesPassed} minutes ago`;
    }
  };
  return (
    <div className="m-2">
      <div className="d-flex flex-column mt-2" style={{ gap: "10px" }}>
        <div className="d-flex" style={{ justifyContent: "space-between" }}>
          <div>
            {updates.length > 1 ? (
              <>
                <span style={titleStyles}>Update Available: </span>
                <span style={{ fontSize: "24px" }}>
                  {" "}
                  {updates[0]?.versionLabel}{" "}
                </span>
              </>
            ) : (
              <span style={titleStyles}>You&apos;re already up to date!</span>
            )}
            {updates.length > 1 && (
              <>
                <p style={{ margin: 0 }}>
                  Released on: {moment(updates[0]?.createdAt).format("LLL")}
                </p>
                <div className="d-flex flex-column">
                  <a
                    href="#"
                    onClick={() => {
                      setReleaseNoteModal(!releaseNoteModal);
                      setReleaseNotes(updates[0]?.releaseNotes);
                    }}
                  >
                    View release notes
                  </a>

                  <a
                    href="#"
                    onClick={() => {
                      setShowMoreReleases(!isShowingMoreReleases);
                    }}
                  >
                    {isShowingMoreReleases ? (
                      <FontAwesomeIcon icon={faCaretUp} />
                    ) : (
                      <FontAwesomeIcon icon={faCaretDown} />
                    )}{" "}
                    {updates.length - 1} releases available but never installed
                  </a>

                  <div
                    style={{
                      maxHeight: "500px",
                      overflow: "auto",
                      width: "100%",
                    }}
                  >
                    {isShowingMoreReleases &&
                      updates.map((update) => (
                        <div className="mb-2" key={update.versionLabel}>
                          <span style={{ fontSize: "24px" }}>
                            {" "}
                            {update?.versionLabel}{" "}
                          </span>
                          <ul style={{ listStyle: "none", padding: 0 }}>
                            <li>
                              Released on:{" "}
                              {moment(update?.createdAt).format("LLL")}
                            </li>
                            <li>
                              <a
                                href="#"
                                onClick={() => {
                                  setReleaseNoteModal(!releaseNoteModal);
                                }}
                              >
                                View release notes
                              </a>
                            </li>
                          </ul>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div
            className="d-flex flex-column"
            style={{ alignItems: "flex-end" }}
          >
            <button
              onClick={() => refreshData()}
              className="rounded"
              style={{
                width: "50px",
                background: "#fff",
                border: "1px solid #d5d9d9",
              }}
            >
              {isRefreshing ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faArrowsRotate} />
              )}
            </button>
            <span style={{ fontSize: "12px" }} className="mt-1">
              Last Updated: {renderLastUpdated()}
            </span>
            <button
              className="rounded mt-1"
              style={{
                background: "#4285f4",
                border: "none",
                color: "#fff",
                padding: "4px 8px",
              }}
              onClick={() => {
                setModalOpen(!modalIsOpen);
              }}
            >
              View Instructions
            </button>
          </div>
        </div>
        <hr />
        <div>
          <span style={titleStyles}>Current Version: </span>
          <span style={{ fontSize: "24px" }}>
            {appInfo.currentRelease.versionLabel}
          </span>
          <ul style={{ listStyle: "none", padding: "10px 0" }}>
            <li>
              Released on:{" "}
              {moment(appInfo.currentRelease?.createdAt).format("LLL")}
            </li>
            <li>
              Installed on:{" "}
              {moment(appInfo.currentRelease?.deployedAt).format("LLL")}
            </li>
            <a
              href="#"
              onClick={() => {
                setReleaseNoteModal(!releaseNoteModal);
                setReleaseNotes(appInfo?.currentRelease?.releaseNotes);
              }}
            >
              View release notes
            </a>
          </ul>
        </div>
        <hr />
        <div>
          <span style={titleStyles}>Version History:</span>
          <ul style={{ listStyle: "none", padding: "10px 0" }}>
            {versionHistory?.releases.map((release) => {
              return (
                <div key={release.versionLabel}>
                  <li style={{ fontSize: "24px" }}> {release.versionLabel}</li>

                  <li>
                    Released on: {moment(release?.createdAt).format("LLL")}
                  </li>
                  <li>
                    Deployed on: {moment(release?.deployedAt).format("LLL")}
                  </li>
                  <a
                    href="#"
                    onClick={() => {
                      setReleaseNoteModal(!releaseNoteModal);
                      setReleaseNotes(release?.releaseNotes);
                    }}
                  >
                    View release notes
                  </a>
                </div>
              );
            })}
          </ul>
        </div>
      </div>
      <Modal
        isOpen={modalIsOpen}
        //  onAfterOpen={afterOpenModal}
        onRequestClose={() => setModalOpen(!modalIsOpen)}
        style={customStyles}
        ariaHideApp={false}
        contentLabel="Example Modal"
      >
        <p className="h2">Helm install instructions</p>
        <p>
          The following instructions should be used for {appInfo.appSlug} to
          install SlackerNews using Helm
        </p>
        <div className="d-flex flex-column" style={{ gap: "40px" }}>
          <div>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>
              1. Login to the registry
            </p>
            <CopyBlock
              text={loginCmd}
              language={"text"}
              showLineNumbers={false}
              wrapLines
              // @ts-ignore
              theme={dracula}
              codeBlock
            />
          </div>

          <div>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>
              2. Install preflight plugin
            </p>
            <CopyBlock
              text={installPreflightCmd}
              language={"text"}
              showLineNumbers={false}
              wrapLines
              // @ts-ignore
              theme={dracula}
              codeBlock
            />
          </div>
          <div>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>
              3. Run preflight checks
            </p>
            <CopyBlock
              text={preflightCmd}
              language={"text"}
              showLineNumbers={false}
              wrapLines
              // @ts-ignore
              theme={dracula}
              codeBlock
            />
          </div>
          <div>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>
              4. Install the latest version of SlackerNews
            </p>
            <CopyBlock
              text={upgradeCmd}
              language={"text"}
              showLineNumbers={false}
              wrapLines
              // @ts-ignore
              theme={dracula}
              codeBlock
            />
          </div>
          <button
            style={{ width: "150px", borderRadius: "6px" }}
            onClick={() => setModalOpen(!modalIsOpen)}
          >
            ok got it!
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={releaseNoteModal}
        //  onAfterOpen={afterOpenModal}
        onRequestClose={() => setReleaseNoteModal(!releaseNoteModal)}
        style={customStyles}
        contentLabel="Example Modal"
        ariaHideApp={false}
      >
        {" "}
        <p className="h3">Release Notes</p>
        {releaseNotes}
      </Modal>
    </div>
  );
}

Page.getLayout = function getLayout(page: any) {
  return (
    <AdminLayout
      currentPage="updates"
      isUpdateAvailable={undefined}
      isReplicatedEnabled={page.props.isReplicatedEnabled}
      childPage={null} // cmon tsx...
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

    const appInfo = await ReplicatedClient.getAppInfo();
    const updates = await ReplicatedClient.getUpdates();
    const loginCmd = await ReplicatedClient.getLoginToRegistryCommand();
    const installPreflightCmd =
      await ReplicatedClient.getInstallPreflightCommand();
    const preflightCmd = await ReplicatedClient.getPreflightCommand();
    const upgradeCmd = await ReplicatedClient.getUpgradeCommand();
    const versionHistory = await ReplicatedClient.getVersionHistory();

    const isReplicatedEnabled = process.env.REPLICATED_ENABLED === "true";

    return {
      props: {
        appInfo,
        updates,
        loginCmd,
        installPreflightCmd,
        preflightCmd,
        upgradeCmd,
        isReplicatedEnabled,
        versionHistory,
      },
    };
  }
}
