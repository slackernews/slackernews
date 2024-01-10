# Contributing to SlackerNews

## Creating an environment

### Initial Setup

You can run a local version of SlackerNews that connects to a sqlite database by running `yarn run dev` from the `./slackernews` directory.

##### Install dependencies

```
cd slackernews
yarn
```

##### Set up .env.local

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


##### Run Server

Once you have an ngrok server and your `.env.local` set up, you can run the server

```
yarn run dev
```

This will run the server in demo mode -- to use real data, you'll need to 
[configure a slack application](https://docs.slackernews.io/slack/)

### Configuring a slack app

To create a Slack app, start by checking the docs at https://docs.slackernews.io/slack/. 
Once you've created the app, enter your credentials at http://localhost:3000/admin/slack

![slack-config](docs/docs/public/images/slack-config.png)

You'll also need to add your [ngrok URL from .env.local](#set-up-envlocal) as an authorized redirect URL for your slack app.

You should also verify your events subscription URL is responding properly:

![event-subscriptions](docs/docs/public/images/event-subscriptions.png)

### Configuring a discord app

To create your own Discord app for SlackerNews, go to Discord's Developer portal at https://discord.com/developers/applications and click "New Application".
After a new Discord app is made, head to the Bot Section and enable the message content intent at the bottom of the page, and at the top is where the bot token is located, upon creation is the only time you can copy the token without resetting it.
When you copy the bot's token, add it to the `.env.local` as such:

```
DISCORD_BOT_TOKEN="token"
```

Then head to the OAuth2 section and go to the URL Generator subsection, and give the app the "bot" scope, and in the new section that pops up, give it the "Administrator" permission. 
Now a link to invite the bot to a Discord server you have manage permissions in can be copied and pasted into a browser.

Once the bot has been added to the server(s), you can start the bot here by running 

```
node discordjs/bot.js
```

And now the bot is running locally on your machine!

### Building and running the helm chart

See [chart/slackernews/README.md](./chart/slackernews/README.md)

### Creating a replicated release


