import { Utilities } from "../utils/utilities";

export const fetchLinks = async(sort, im, t, p) => {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/v1/links/${sort}?im=${im}`;
    if (t) {
      url = `${url}&t=${t}`;
    }
    if (!p) {
      p = 0;
    }
    url = `${url}&p=${p}`;

    const res = await fetch(url, {
      method: `GET`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return;
    }

    const data = await res.json();

    return data;
  } catch (err) {
    console.error(err);
  }
}

export const channelName = (channelName, channelId) => {
  if (channelName !== "") {
    return `#${channelName}`;
  } else if (channelId.startsWith("D")) {
    return `a direct message`;
  } else {
    return `slack`;
  }
}
