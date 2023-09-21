import { IntegrationWithConfig } from "../integration";
import { getParam } from "../param";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';


export class SlackIntegration {
  constructor(configuredIntegration: IntegrationWithConfig) {

  }

  public async getDomain(url: string): Promise<string> {
    const domain = await getParam("slackDomain");
    return `${domain}.slack.com`;
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    const domain = await getParam("slackDomain");
    const fullDomain = `${domain}.slack.com`;

    const u = new URL(url);
    return (u.hostname === fullDomain)
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    let message = "";

    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/");

    if (pathParts.length === 4) {
      let ts = pathParts[3];
      // remove the leading "p"
      ts = ts.substring(1);
      // split into 10.6 format for slack
      ts = `${ts.substring(0, 10)}.${ts.substring(10)}`;

      // get the conversation history from this
      const res = await fetch(`https://slack.com/api/conversations.history?channel=${pathParts[2]}&latest=${ts}&limit=1&inclusive=true`, {
        headers: {
          "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
          "Content-Type": `application/json`,
        },
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error);
      }

      if (data.messages.length > 0) {
        message = data.messages[0].text;
      }

      // dereference any channels and user ids in the message
      const messageParts = message.split(" ");
      for (let i = 0; i < messageParts.length; i++) {
        if (messageParts[i].startsWith("<@U") && messageParts[i].endsWith(">")) {
          // list all slack users, because sometimes these are guests
          const usersRes = await fetch(`https://slack.com/api/users.list`, {
            headers: {
              "Authorization": "Bearer " + await getParam("SlackBotToken"),
              "Content-Type": "application/json",
            }
          });
          const usersData = await usersRes.json();
          if (!usersData.ok) {
            throw new Error(usersData.error);
          }

          console.log(usersData);

          const user = usersData.members.find((u: any) => u.id === messageParts[i].substring(2, messageParts[i].length - 1));
          if (user) {
            messageParts[i] = `@${user.name}`;
          }
        }
      }

      message = messageParts.join(" ");
    }

    let truncatedMessage = message;
    if (truncatedMessage.length > 100) {
      truncatedMessage = truncatedMessage.substring(0, 100) + "...";
    }

    return `#${channel.name} | ${user.fullName}: ${truncatedMessage}}`
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "slack-icon.ico";
  }
}
