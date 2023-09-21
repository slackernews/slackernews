# SlackerNews Helm Chart

This chart is built with the intent of only releasing via Replicated.

## Iterating locally

1. Get a K8s server and Helm (3.8 or later)
2. Get a license from Replicated and copy the license id (password from the Helm install instructions)
3. You can install and mock the work performed by the Replicated registry like this (from the root of this repo):

```

```

Build and push your images to ttl.sh, your namespace:
```
make build-ttlsh
```

```
helm uninstall slackernews -n slackernews && \
helm upgrade --install --namespace slackernews --create-namespace  \
    slackernews \
    ./chart/slackernews \
    --set postgres.password=password \
    --set slack.clientId=$SLACKERNEWS_UAT_SLACK_CLIENTID \
    --set slack.clientSecret=$SLACKERNEWS_UAT_SLACK_CLIENTSECRET \
    --set slack.token=$SLACKERNEWS_UAT_SLACK_TOKEN \
    --set slackernews.domain=$SLACKERNEWS_DOMAIN \
    --set replicated.licenseId=$SLACKERNEWS_LICENSEID \
    --set images.pullSecrets.replicated.dockerconfigjson="" \
    --set service.type=LoadBalancer \
    --set admin-console.service.type=LoadBalancer \
    --set admin-console.kotsadm.kotsadmPassword=password \
    --set images.slackernews.tag=$SLACKERNEWS_IMAGE_TAG \
    --set images.slackernews.repository=ttl.sh/$SLACKERNEWS_IMAGE_NAMESPACE/slackernews \
    --set images.slackernews.pullPolicy=Always \
    --set images.slackernews.pullSecret="" \
    --set images.slackernews_migrations.tag=$SLACKERNEWS_IMAGE_TAG \
    --set images.slackernews_migrations.repository=ttl.sh/$SLACKERNEWS_IMAGE_NAMESPACE/slackernews-migrations \
    --set images.slackernews_migrations.pullPolicy=Always \
    --set images.slackernews_migrations.pullSecret="" \
    --set service.tls.cert=$SLACKERNEWS_CERT \
    --set service.tls.key=$SLACKERNEWS_KEY
```

## Releasing

To release, just push a semver tag to the repo. The chart will automatically be released on the Unstable channel.

## UAT

```
helm install --namespace slackernews --create-namespace  \
    slackernews \
    oci://registry.replicated.com/slackernews/unstable/slackernews \
    --set postgres.password=password \
    --set slack.clientId=$SLACKERNEWS_UAT_SLACK_CLIENTID \
    --set slack.clientSecret=$SLACKERNEWS_UAT_SLACK_CLIENTSECRET \
    --set slack.token=$SLACKERNEWS_UAT_SLACK_TOKEN \
    --set slackernews.domain=$SLACKERNEWS_DOMAIN \
    --set service.type=LoadBalancer \
    --set admin-console.adminConsole.password=SLACKERNEWS_UAT_ADMINCONSOLE_PASSWORD 
```
