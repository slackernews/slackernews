# Application configuration

Once the chart is installed and running, you can configure the application at:

```
http[s]://<ip address>/admin
```

(The exact URL is going to vary based on how you installed and configured the chart).

The application configuration is split into several sections:

## Authentication
This is used to control which users have access to SlackerNews. We currently support Slack Auth only.

## Chrome Plugin
The SlackerNews Chrome plugin is the easiest way for site admins to turn the urls collected and displayed into a more rich experience by collecting page titles for each link (without having to integrate with each authenticated service directly.)

## Google Drive
1.Create a GCP project
2. IAM -> Service Accounts
3. Create new
    ```name: SlackerNews
    service account id: news.mycompany.com
    description: used to get page titles for google drive items
    role:  basic / viewer
    continue.
    done.```
    **Important** find the new row and copy the auto-generated Oauth2 Client ID (Unique ID)
4.On the new service account:
5. manage keys -> create new key (JSON format) (should download to your local machine)
6. Log in to admin.google.com https://admin.google.com/ac/owl/domainwidedelegation
7. Add New
8. Paste in the previously copied clientid (Unique ID of the service account)
9. Paste in this scope: https://www.googleapis.com/auth/drive.metadata.readonly
10. Visit slackernews integrations (/admin/integrations):
11. paste the full contents of the json key into the configuration for google drive
12. Enable the google drive integration


## GitHub
SlackerNews will also use the service account key on this page to retrieve the titles of the repos, issues, users etc shared.

## Outline

## Shortcut

