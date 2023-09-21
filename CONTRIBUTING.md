# Contributing to SlackerNews

## Creating an environment

### Quick and local (sqlite)
You can run a local version of SlackerNews that connects to a sqlite database by running `yarn run dev` from the `./slackernews` directory.

In order to log in via Slack, you need a redirect_uri that can't be localhost. We recommend ngrok, and using that to access your local dev env.

```
ngrok http --subdomain=you 3000
```

You can configure Google Auth and Slack by editing the `.env.local` file:

```
NEXT_PUBLIC_API_ENDPOINT=http://localhost:3000
SLACK_AUTH_REDIRECT_URI=https:/<ngrok or something>/login/callback
DB_URI="./slackernews.db"
```
