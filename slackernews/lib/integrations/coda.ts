import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';


export class CodaIntegration {
  private token: string;

  constructor(config: any) {
    this.token = config.apiToken;
  }

  public async getDomain(url: string): Promise<string> {
    return "coda.io";
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    const pathParts = u.pathname.split("/");

    if (pathParts.length < 3) {
      return url;
    }

    const split = pathParts[2].split("_d");
    if (split.length < 1) {
      return url;
    }

    return `https://coda.io/d/_d${split[1]}`;
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    const parsed = new URL(url);
    return parsed.hostname === "coda.io";
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const res = await fetch(url);
    const text = await res.text();
    const $ = cheerio.load(text);

    return $("title").text();
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "coda-icon.png";
  }
}
