# Slack App
You'll need to create a Slack App to integrate with your SlackNews instance. This Slack app will provide user creation, authentication, as well as access the Slack messages for analysis. Luckily, this is as easy as copy/paste of a YAML manifest.

1. Visit your Slack Apps
2. [create a new app](https://api.slack.com/apps?new_app=1)
3. select "from an app manifest"
4. select your workspace
5. Paste the following manifest in (be sure to change the `redirect_url` and the `request_url` to your custom domain with the paths specfified below).

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
    request_url: https://<sub.yourdomain.com>/v1/webhooks/slack
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
    
    Login will be automatically restricted to users who are logging into the Slack app that the bot token is installed on.
