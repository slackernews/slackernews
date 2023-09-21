import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';


export class DefaultIntegration {
  constructor(configuredIntegration: IntegrationWithConfig) {

  }

  public async getDomain(url: string): Promise<string> {
    return new URL(url).hostname;
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    return true;
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const res = await fetch(url);
    const text = await res.text();
    const $ = cheerio.load(text);

    return $("title").text();
  }

  public async getDocumentIcon(url: string): Promise<string> {
    const res = await fetch(url);
    const text = await res.text();
    const $ = cheerio.load(text);

    const icon = $("link[rel='icon']").attr("href");
    if (icon) {
      return icon;
    }

    const appleTouchIcon = $("link[rel='apple-touch-icon']").attr("href");
    if (appleTouchIcon) {
      return appleTouchIcon;
    }

    return "";
  }
}
