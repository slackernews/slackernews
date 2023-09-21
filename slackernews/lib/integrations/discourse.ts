import { SlackChannel, SlackUser } from "../slack";

export class DiscourseIntegration {
  private domain: string;
  private apiKey: string;
  private apiUsername: string;

  constructor(config: any) {
    this.domain = config.domain;
    this.apiKey = config.apiKey;
    this.apiUsername = config.apiUsername;
  }

  public async getDomain(url: string): Promise<string> {
    const parsed = new URL(url);
    return parsed.hostname;
  }

  public async getCleanedUrl(url: string): Promise<string> {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");

    if (parts.length < 4) {
      return url;
    }

    return url.replace(`/${parts[2]}`, "");
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    const parsed = new URL(url);
    return parsed.hostname === this.domain;
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");

    if (parts.length < 4) {
      return url;
    }

    const topicId = parts[3];
    const topicUrl = `https://${this.domain}/t/${topicId}.json`;

    const topicRes = await fetch(topicUrl, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
        "Api-Username": this.apiUsername,
      },
    });

    const topicJson = await topicRes.json();

    const categoryUrl = `https://${this.domain}/c/${topicJson.category_id}.json`;

    const categoryRes = await fetch(categoryUrl, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
        "Api-Username": this.apiUsername,
      },
    });

    const categoryJson = await categoryRes.json();

    return `${topicJson.title} (${categoryJson.name})`
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "discourse-icon.png";
  }
}
