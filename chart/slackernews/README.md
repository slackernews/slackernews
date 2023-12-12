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
# set your namespace
export SLACKERNEWS_IMAGE_NAMESPACE=${USER}

# something random, if you want
export SLACKERNEWS_IMAGE_NAMESPACE=$(head -c 16 /dev/urandom | xxd -p)

# build / push
make build-ttlsh
```

```
helm uninstall slackernews -n slackernews; \
helm upgrade --install --namespace slackernews --create-namespace  \
    slackernews \
    ./chart/slackernews \
    --set replicated.enabled=false \
    --set slack.clientId=$SLACKERNEWS_UAT_SLACK_CLIENTID \
    --set slack.clientSecret=$SLACKERNEWS_UAT_SLACK_CLIENTSECRET \
    --set slack.userToken=$SLACKERNEWS_UAT_SLACK_USER_TOKEN \
    --set slack.botToken=$SLACKERNEWS_UAT_SLACK_BOT_TOKEN \
    --set slackernews.domain=$SLACKERNEWS_DOMAIN \
    --set images.slackernews.tag=$SLACKERNEWS_IMAGE_TAG \
    --set images.slackernews.repository=ttl.sh/$SLACKERNEWS_IMAGE_NAMESPACE/slackernews:12h \
    --set images.slackernews.pullPolicy=Always \
    --set images.slackernews.pullSecret="" \
    --set sqlite.enabled=false \
    --set postgres.enabled=true \
    --set postgres.deploy_postgres=true \
    --set postgres.password=password 
    
```

if you are using the built-in `kind` cluster from `make dev-cluster`, add a NodePort so you can easily access slackernews and postgres locally

```
    --set service.type=NodePort \
    --set service.nodePort.port=3000 \
    --set postgres.service.type=NodePort \
    --set postgres.service.nodePort.port=5432 \
```

Then you can open slackernews on localhost:3000 (you still need an ngrok or other tunnel to log in, etc), and you can
access postgres locally on port 5432.

Once you have signed in for the first time, you will need to flip the admin bit for your user. 
These instructions are for a local kind cluster exposing postgres on 5432. 

```shell
psql --host 127.0.0.1 \slackernews --user slackernews \
    -c "UPDATE slackernews_user SET is_super_admin = TRUE WHERE email_address = '<your email>'"
```

You can also create a port-forward with kubectl to make the above command work for a remote cluster:

```shell
kubectl port-forward svc/postgres 5432:5432
```

From there, you can navigate to `/admin` and [configure slack](../../CONTRIBUTING.md#configuring-a-slack-app).

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
