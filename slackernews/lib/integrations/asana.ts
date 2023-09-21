import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';

const urlTypeUnknown = "unknown";
const urlTypeProject = "project";
const urlTypeTask = "task";
const urlTypeSubtask = "subtask";
const urlTypeMessage = "message";

interface AsanaUrl {
  val: string;
  type: string;
}

export class AsanaIntegration {
  private token: string;

  constructor(config: any) {
    this.token = config.personalAccessToken;
  }

  public async getDomain(url: string): Promise<string> {
    return "app.asana.com";
  }

  public async getCleanedUrl(url: string): Promise<string> {
    return url;
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    const parsed = await this.parseAsanaUrl(url);
    return parsed.type !== urlTypeUnknown && parsed.val !== "";
  }

  async parseAsanaUrl(url: string): Promise<AsanaUrl> {
    if (!url.startsWith("https://app.asana.com/0/")) {
      return {
        val: "",
        type: urlTypeUnknown,
      };
    }

    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");

    if (parts.length < 4) {
      return {
        val: "",
        type: urlTypeUnknown,
      }
    }


    if (parts.length == 4 && parts[3] === "board") {
      return {
        val: parts[2],
        type: urlTypeProject,
      };
    }

    if (parts.length == 5 && parts[3] === "f") {
      if (parts[2] == "0") {
        return {
          val: parts[3],
          type: urlTypeSubtask,
        };
      } else {
        return {
          val: parts[3],
          type: urlTypeTask,
        };
      }
    }

    if (parts[2] == "0") {
      return {
        val: parts[parts.length - 1],
        type: urlTypeMessage,
      };
    }

    return {
      val: "",
      type: urlTypeUnknown,
    };
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    const parsed = await this.parseAsanaUrl(url);

    if (parsed.type === urlTypeUnknown) {
      return url;
    }

    let apiUrl = "";
    switch (parsed.type) {
      case urlTypeProject:
        apiUrl = `https://app.asana.com/api/1.0/projects/${parsed.val}`;
        break;
      case urlTypeTask:
        apiUrl = `https://app.asana.com/api/1.0/tasks/${parsed.val}`;
        break;
      case urlTypeSubtask:
        apiUrl = `https://app.asana.com/api/1.0/tasks/${parsed.val}`;
        break;
    }

    if (apiUrl === "") {
      return url;
    }

    const res = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${this.token}`,
      },
    });

    const json = await res.json();
    if (!json.data || !json.data.name) {
      return url;
    }

    return json.data.name;
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "asana-icon.png";
  }
}
