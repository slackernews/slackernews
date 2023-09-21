import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';


export class FigmaIntegration {
  constructor(config: any) {
  }

  public async getDomain(url: string): Promise<string> {
    return "figma.com";
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    const parsed = new URL(url);
    return parsed.hostname === "figma.com";
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const res = await fetch(url);
    const text = await res.text();
    const $ = cheerio.load(text);

    return $("title").text();
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "figma-icon.ico";
  }
}
