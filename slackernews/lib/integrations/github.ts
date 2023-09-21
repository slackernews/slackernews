import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';


export class GitHubIntegration {
  private token: string;

  constructor(config: any) {
    this.token = config.personalAccessToken;
  }

  public async getDomain(url: string): Promise<string> {
    return "github.com";
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    // if the url starts with github.com
    const parsed = new URL(url);
    return parsed.hostname === "github.com";
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    // try to parse it as a public url
    try {
      let res: Response;

      res = await fetch(url);

      if (res.status >= 400) {
        return this.getDocumentTitleFromApi(url, user, channel);
      }
      const text = await res.text();
      const $ = cheerio.load(text);

      return $("title").text();
    } catch (err) {
      console.log(err);
      return "";
    }
  }

  async getDocumentTitleFromApi(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    // is it an issues url?
    console.log(`github.getDocumentTitleFromApi(${url})`);
    const issuesMatch = url.match(/https:\/\/github.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
    if (issuesMatch) {
      const [, owner, repo, issueNumber] = issuesMatch;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
      // add the api token to the request
      const res = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${this.token}`,
        },
      });
      const json = await res.json();
      return json.title;
    }

    // is it a pull request url?
    const pullRequestMatch = url.match(/https:\/\/github.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (pullRequestMatch) {
      const [, owner, repo, pullRequestNumber] = pullRequestMatch;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}`;
      // add the api token to the request
      const res = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${this.token}`,
        },
      });
      const json = await res.json();
      console.log(json);
      return json.title;
    }

    // is it an actions run?
    const actionsRunMatch = url.match(/https:\/\/github.com\/([^\/]+)\/([^\/]+)\/actions\/runs\/(\d+)/);
    if (actionsRunMatch) {
      const [, owner, repo, runId] = actionsRunMatch;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
      // add the api token to the request
      const res = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${this.token}`,
        },
      });
      const json = await res.json();
      return json.head_commit.message;
    }

    // give up, return the url
    return url;
  }

  public async getDocumentIcon(url: string): Promise<string> {
    return "github-icon.png";
  }
}
