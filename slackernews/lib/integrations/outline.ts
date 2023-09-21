import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';


export class OutlineIntegration {
  private token: string;
  private domain: string;

  constructor(config: any) {
    this.token = config.outlineToken;
    this.domain = config.domain;
  }

  public async getDomain(url: string): Promise<string> {
    return this.domain;
  }

  public async getCleanedUrl(url: string): Promise<string> {
    return url;
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    // if the url starts with github.com
    const parsed = new URL(url);
    return parsed.hostname === this.domain;
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/");
    const docId = pathParts[2];

    const res = await fetch(`https://${this.domain}/api/documents.info`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      method: "POST",
      body: JSON.stringify({
        id: docId,
      }),
    });

    const data = await res.json();
    if (!data.data) {
      return url;
    }

    return data.data.title;
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "handbook.png";
  }
}
