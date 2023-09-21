import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';


export class ShortcutIntegration {
  private token: string;

  constructor(config: any) {
    this.token = config.shortcutToken;
  }

  public async getDomain(url: string): Promise<string> {
    return "shortcut.com";
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    // if the url starts with app.shortcut.com
    const parsed = new URL(url);
    return parsed.hostname === "app.shortcut.com";
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/");

    // the story id is the 3rd from the end path part
    const storyId = pathParts[pathParts.length - 3];

    const res = await fetch(`https://api.app.shortcut.com/api/v3/stories/${storyId}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Shortcut-Token": this.token,
      },
    });

    const data = await res.json();
    if (!data) {
      return url;
    }

    return data.name;
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "shortcut.png";
  }
}
