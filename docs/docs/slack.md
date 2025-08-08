# Slack App

You'll need to create a Slack App to integrate with your SlackNews instance.
This Slack app will provide user creation, authentication, as well as access
the Slack messages for analysis. Luckily, this is as easy as copy/paste of a
YAML manifest.

Before you being, ensure that you have [configured your domain and
TLS](/domain) for your SlackerNews instance.

1. Visit your Slack Apps
2. [create a new app](https://api.slack.com/apps?new_app=1)
3. select "from an app manifest"
4. select your workspace
5. Paste the following manifest in (be sure to change the `redirect_url` and
   the `request_url` to use the domain at which you'll host SlackerNews).

```yaml
display_information:
  name: SlackerNews
  description: SlackerNews
  background_color: "#333333"
features:
  bot_user:
    display_name: SlackerNews
    always_online: false
oauth_config:
  redirect_urls:
    - https://<sub.yourdomain.com>/login/callback
  scopes:
    user:
      - links:read
      - channels:history
      - reactions:read
      - channels:write
    bot:
      - channels:read
      - links:read
      - team:read
      - users:read
      - users:read.email
      - reactions:read
      - usergroups:read
      - channels:join
      - channels:history
settings:
  event_subscriptions:
    request_url: https://<sub.yourdomain.com>/api/webhooks/slack
    user_events:
      - message.channels
      - reaction_added
    bot_events:
      - link_shared
      - message.channels
      - reaction_added
      - reaction_removed
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```
6. Click "Create".

7. Install into your workspace.

!!! Note
    
    Login will be automatically restricted to users who are logging into the
    Slack app that the bot token is installed on.

Once the app is installed, head to `YOUR_INSTANCE_URL`/admin/slack to
configure the relevant fields

## Next steps

Once you have created the Slack app, you're ready to install SlackerNews using
one of the [supported installation methods](/supported-installations).
