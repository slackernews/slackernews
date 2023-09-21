import { SlackChannel, SlackUser } from "../slack";


export class NotionIntegration {
  private token: string;

  constructor(config: any) {
    this.token = config.integrationToken;
  }

  public async getDomain(url: string): Promise<string> {
    return "www.notion.so"
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    const u = new URL(url);
    if (u.hostname !== "www.notion.so") {
      return false;
    }

    const pathParts = u.pathname.split("/");
    if (pathParts.length < 2) {
      return false;
    }

    return true;
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const u = new URL(url);
    const pathParts = u.pathname.split("/");

    if (pathParts.length < 2) {
      return url;
    }

    const pageParts = pathParts[pathParts.length - 1].split("-");
    if (pageParts.length < 1) {
      return url
    }

    const pageId = pageParts[pageParts.length - 1];

    // retrieve a page
    const apiUrl = `https://api.notion.com/v1/blocks/${pageId}`;
    const res = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
        "Authorization": this.token,
      },
    });

    const data = await res.json();
    if (!data) {
      return url;
    }

    return data.child_path.title;
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "notion-icon.png";
  }
}
