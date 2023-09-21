import React, { useState } from "react";
import Link from "next/link";
import moment from "moment";
import { channelName } from "../util/links";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { OverlayTrigger, Popover } from "react-bootstrap";
import Image from "next/image";

export default function LinkRow({
  renderableLink,
  rowNumber,
  onEdited,
  isEditable,
  showHide,
  showBoost,
  isDebugMode,
}) {
  const [editingLink, setEditingLink] = useState(null);
  const [editingLinkValue, setEditingLinkValue] = useState("");
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [addToScore, setAddToScore] = useState(0);
  const [isHidden, setIsHidden] = useState(renderableLink.link.isHidden);
  const [justBoosted, setJustBoosted] = useState(false);
  const [linkShares, setLinkShares] = useState([]);

  const onBoost = async (ev) => {
    // the api enforces the super admin permission here
    ev.preventDefault();
    try {
      const res = await fetch(`/api/link/boost?link=${encodeURIComponent(renderableLink.link.url)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setAddToScore(addToScore + 1);

        setJustBoosted(true);
        setTimeout(() => {
          setJustBoosted(false);
        }, 2000);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const onHide = async (ev) => {
    // the api enforces the super admin permission here
    ev.preventDefault();
    try {
      const res = await fetch(`/api/link/hide?link=${encodeURIComponent(renderableLink.link.url)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isHidden: !isHidden,
        }),
      });
      if (res.ok) {
        setIsHidden(!isHidden);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onVoteUp = async (ev) => {
    ev.preventDefault();
    try {
      const res = await fetch(`/api/upvote?link=${encodeURIComponent(renderableLink.link.url)}`, {
        method: "POST",
      });
      if (res.ok) {
        setIsUpvoted(true);
        setAddToScore(1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = async (link, ev) => {
    ev.preventDefault();
    setEditingLinkValue(link);
    setEditingLink(link);
  };

  const loadShares = async (link) => {
    try {
      const res = await fetch(`/api/shares?link=${encodeURIComponent(link.url)}`, {
        method: "GET",
      });
      if (!res.ok) {
        console.error("not ok");
        return;
      }

      const data = await res.json();
      setLinkShares(data);
    } catch (err) {
      console.error(err);
    }
  };

  let sharedIn = (
    <span>{channelName(renderableLink.firstShare.channelName, renderableLink.firstShare.channelId)}</span>
  );

  let title =
    editingLink === renderableLink.link.title ? (
      <span>
        <input
          type="text"
          style={{ width: "400px" }}
          value={editingLinkValue}
          onChange={(e) => {
            setEditingLinkValue(e.target.value);
          }}
        />{" "}
        <Link
          href="#"
          className="btn btn-primary btn-sm"
          onClick={async (ev) => {
            ev.preventDefault();
            const res = await fetch(`/api/link`, {
              method: `PUT`,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                link: renderableLink.link.url,
                title: editingLinkValue,
              }),
            });

            if (!res.ok) {
              return;
            }

            if (onEdited) {
              onEdited(renderableLink, editingLinkValue);
            }

            setEditingLink(null);
            setEditingLinkValue("");
          }}
        >
          Save
        </Link>{" "}
        <Link
          href="#"
          className="btn btn-secondary btn-sm"
          onClick={(ev) => {
            ev.preventDefault();
            setEditingLink(null);
            setEditingLinkValue("");
          }}
        >
          Cancel
        </Link>
      </span>
    ) : (
      <Link href={renderableLink.link.url} target="_blank" rel="noreferrer">
        {renderableLink.link.title
          ? renderableLink.link.title
          : renderableLink.link.url}
      </Link>
    );

  let editButton =
    editingLink === renderableLink.link.title ? null : (
      <Link
        href="#"
        onClick={handleEditClick.bind(this, renderableLink.link.title)}
        className="edit-button"
      >
        <i className="bi bi-pencil"></i>
      </Link>
    );
  if (!isEditable) {
    editButton = null;
  }

  let debugButton = isDebugMode ? (
    <>
      <Link
        href={`/debug/${encodeURIComponent(renderableLink.link.url)}`}
        className="debug-button" target="_blank">
          <i className="bi bi-bug"></i>
      </Link>{" "}
    </>
  ) : null;

  const repliesPopover = (
    <Popover id="popover-basic">
      <Popover.Body>
        <span>
          <table>
            {linkShares.map((share) => {
              if (share.replyCount === 0) {
                return (
                  <tr key={share.id}>
                    <td>
                      Shared in{" "}
                      <Link href={share.permalink} target="_blank" className="discuss">
                          {share.channelName}
                      </Link>{" "}
                      ({moment(share.sharedAt).fromNow()})
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={share.messageTs}>
                  <td>
                    <strong>
                      {share.replyCount}{" "}
                      {share.replyCount === 1 ? "reply" : "replies"} in{" "}
                      <Link href={share.permalink} target="_blank" className="share">
                          <span>#{share.channelName}</span>
                      </Link>
                    </strong>{" "}
                    ({moment(share.sharedAt).fromNow()})
                  </td>
                </tr>
              );
            })}
          </table>
        </span>
      </Popover.Body>
    </Popover>
  );

  return (
    <tr className="link-row">
      <th
        scope="row"
        style={{ width: "32px", color: "#828282" }}
        className="link-row-header"
      >
        {rowNumber}.
      </th>
      <td
        style={{ width: "16px", paddingRight: "0px" }}
        className="link-row-icon"
      >
        {renderableLink.link.icon.startsWith("data:image") ? (
          <Image
            src={renderableLink.link.icon}
            width="14"
            height="14"
            alt={"icon"}
          />
        ) : (
          <Image
            src={`/images/linkicons/${renderableLink.link.icon}`}
            width="14"
            height="14"
            alt={"icon"}
          />
        )}
        <br />
        {!isUpvoted && !renderableLink.isUpvoted ? (
          <Link href="#" onClick={onVoteUp}>
            <FontAwesomeIcon
              className="vote-up"
              icon={faCaretUp}
              style={{ marginTop: "6px", marginLeft: "2px" }}
            />
          </Link>
        ) : null}
      </td>
      <td style={{ paddingLeft: "8px" }} className="link-row-content">
        <span className="link-row-content-title">{title}</span> {editButton}{" "}
        {debugButton}(
        <span className="link-row-content-domain">
          {renderableLink.link.domain}
        </span>
        )<br />
        <span className="link-row-content-share">
          {parseInt(renderableLink.displayScore) + addToScore} points by{" "}
          {renderableLink.firstShare.userId &&
          !renderableLink.firstShare.userId.startsWith("SEED_USER_") ? (
            <Link
              href={`/user?id=${renderableLink.firstShare.userId}`}
              target="_blank" rel="noreferrer">
                <span className="link-row-content-share-username">
                  {renderableLink.firstShare.fullName}
                </span>
            </Link>
          ) : (
            <span className="link-row-content-share-username">
              {renderableLink.firstShare.fullName}
            </span>
          )}{" "}
          <span
            title={moment(renderableLink.firstShare.sharedAt)
              .utc()
              .format("dddd, MMMM Do YYYY, h:mm:ss a")}
            className="link-row-content-share-timestamp"
          >
            {moment(renderableLink.firstShare.sharedAt).fromNow()}
          </span>{" "}
          in <span className="link-row-content-share-channel">{sharedIn}</span>
          {renderableLink.replyCount && renderableLink.replyCount > 0 ? (
            <OverlayTrigger
              trigger="click"
              placement="bottom-start"
              rootClose
              onToggle={loadShares.bind(this, renderableLink.link)}
              overlay={repliesPopover}
            >
              <span className="link-row-content-share-reply-count">
                {" "}
                |{" "}
                {`${renderableLink.replyCount} ${
                  renderableLink.replyCount == 1 ? "reply" : "replies"
                }`}
              </span>
            </OverlayTrigger>
          ) : (
            <span>
              {" "}
              |{" "}
              <Link href={renderableLink.firstShare.permalink} target="_blank" rel="noreferrer">
                  discuss
              </Link>
            </span>
          )}
          {showHide ? (
            <span className="link-row-content-share-hide">
              {" "}
              |{" "}
              <Link href="#" onClick={onHide}>
                {isHidden ? "show" : "hide"}
              </Link>
            </span>
          ) : null}
          {showBoost ? (
            <span className="link-row-content-share-boost">
              {" "}
              |{" "}
              <Link
                href="#"
                onClick={onBoost}
                className={`boost-link ${justBoosted ? "boosted" : null}`}
              >
                {justBoosted ? "boosted +1" : "boost"}
              </Link>
            </span>
          ) : null}
        </span>
      </td>
    </tr>
  );
}
