# Checking for and installing updates

Depending on how you installed SlackerNews, the instructions to update will be similar. For example, if you installed using [Helm](/helm), you will use Helm to upgrade. If you installed using the [Virtual Machine](/vm) method, you'll use the SlackerNews admin console to upgrade.


## Helm

For Helm-based installations, upgrading is the same process as installation, but run `helm upgrade` instead of `helm install`. 

For example:

```
#!/bin/bash

export SLACKERNEWS_CERT=`cat ./certificate.pem`
export SLACKERNEWS_KEY=`cat ./key.pem`

helm upgrade --namespace slackernews \
    slackernews \
    oci://registry.replicated.com/slackernews/stable/slackernews \
    --set postgres.deploy_postgres=true \
    --set postgres.password=secret-password \
    --set slack.clientId=30505101... \
    --set slack.clientSecret=3901da74... \
    --set slack.botToken=xoxb-30505101... \
    --set slack.userToken=xoxp-30505101... \
    --set slackernews.domain=news.somebigbank.com \
    --set service.type=LoadBalancer \
    --set admin-console.adminConsole.password=my-secure-password \
    --set service.tls.cert="$SLACKERNEWS_CERT" \
    --set service.tls.key="$SLACKERNEWS_KEY"
```

## Virtual Machine

For VM based installs, click the "Check for updates" button in the Admin Console (on port :8800) and follow the instructions provided. You will often be able to complete the upgrade from within the browser. When the cluster itself needs to be upgrades, the Admin Console will provide a command run on the VM.
