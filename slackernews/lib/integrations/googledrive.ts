import { IntegrationWithConfig } from "../integration";
import { SlackChannel, SlackUser } from "../slack";
import * as cheerio from 'cheerio';
import { google } from 'googleapis';

export class GoogleDriveIntegration {
  private serviceAccountKey: any;

  constructor(config: any) {
    this.serviceAccountKey = JSON.parse(config.serviceAccountKey);
  }

  public async getDomain(url: string): Promise<string> {
    return "docs.google.com";
  }

  public async getCleanedUrl(url: string): Promise<string> {
    // remove the fragment from the url
    const u = new URL(url);
    u.hash = '';
    const withoutHash = u.toString();

    // remove the `/edit` from the url
    const editMatch = withoutHash.match(/\/edit$/);
    if (editMatch) {
      return withoutHash.replace(/\/edit$/, '');
    }

    return withoutHash;
  }

  public async isUrlManagedByIntegration(url: string): Promise<boolean> {
    // if the url starts with github.com
    const parsed = new URL(url);
    return parsed.hostname === "docs.google.com";
  }

  public async getDocumentTitle(url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
    if (!user.email) {
      return await this.getCleanedUrl(url);
    }

    // use the google sdk to get a jwt from the service account,
    // and then get the filename from the drive api
    const googleAuthOptions: any = {
      credentials: this.serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
      clientOptions: {
        subject: user.email,
      },
    };

    const auth = new google.auth.GoogleAuth(googleAuthOptions);

    const drive = google.drive({ version: "v3", auth });

    const parsed = await this.getCleanedUrl(url);

    const parsedParts = parsed.split("/");

    // documentId is the last part in the path
    const documentId = parsedParts[parsedParts.length - 1];

    // get the metadata from the file
    const res = await drive.files.get({
      fileId: documentId,
      fields: "name",
    });

    if (!res.data.name) {
      return await this.getCleanedUrl(url);
    }

    return res.data.name;
  }


  public async getDocumentIcon(url: string): Promise<string> {
    const parsed = await this.getCleanedUrl(url);

    const parsedParts = parsed.split("/");
    const documentType = parsedParts[1];

    switch (documentType) {
      case "document":
        return "google-docs.png";
      case "spreadsheets":
        return "google-sheets.png";
      case "presentation":
        return "google-slides.png";
      case "forms":
        return "google-forms.png";
      default:
        return "google-drive.png";
    }
  }
}
