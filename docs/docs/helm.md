# Helm installation

If you have access to a Kubernetes cluster (preferably from a managed service like EKS, GKE, AKS, Rancher, etc), we recommend using Helm to perform the installation (or integrate it into a CI pipeline). SlackerNews will install completely inside a single namespace in the cluster, and does not require any cross-namespace permission.

The following steps are *required* to install SlackerNews into your Kubernetes cluster using Helm:

1. Install Helm 3.8 or later on your local workstation.
2. Install [Krew](https://krew.sigs.k8s.io/docs/user-guide/quickstart/) to manage client-side only plugins to kubectl. Nothing here will be installed to your cluster.
3. Log in to our Helm registry using the username and password provided:

```shell
helm registry login \
    chart.slackernews.io \
    --username <you@company.com> \
    --password <provided>
```

## Run Preflight Checks

We publish a set of Preflight Checks that you can easily run to determine if your cluster and environment meet the minimum requirements to run SlackerNews:

Install the Preflight `kubectl` plugin and run our Preflight Checks:
```shell
kubectl krew install preflight
kubectl preflight oci://chart.slackernews.io/slackernews  
```

If there are errors or warnings reported, take a look and resolve the issue presented. If you need help, save the output of your preflights (press `s`), and email them to us to guidance.

## Install SlackerNews

Finally, run the `helm install` command:

The command below includes a few optional parameters to make installation a little easier:

```
#!/bin/bash

export SLACKERNEWS_CERT=`cat ./certificate.pem`
export SLACKERNEWS_KEY=`cat ./key.pem`

helm install --namespace slackernews --create-namespace  \
    slackernews \
    oci://chart.slackernews.io/slackernews/slackernews \
    --set postgres.deploy_postgres=true \
    --set postgres.enabled=true \
    --set postgres.password=password \
    --set slackernews.domain=<YOUR HOSTNAME> \
    --set service.tls.enabled=true \
    --set service.tls.cert="$SLACKERNEWS_CERT" \
    --set service.tls.key="$SLACKERNEWS_KEY" \
    --version 1.0.5
```

## Chart configuration

The following values can be provided to the chart when installing. For more information on these parameters, see the [advanced configuration](/advanced) docs.

### Required and commonly used values

#### Database
| Key | Default | Description |
|-----|---------|-------------|
| `postgres.deploy_postgres` | `true` | When `true`, the required postgres database will be deployed in cluster. Set to false if you are running this on your own. We recommend using a managed service to run the database, and then the SlackerNews instance in your cluster will be stateless. |
| `postgres.password` | | Required when running postgres in the cluster only. This must be set to the password for the postgres database. When deploying postgres in-cluster, set to the value you want to use for the password |
| `postgres.uri` | | This is required when `postgres.deploy_postgres` is set to `false`. Set this to the psql:// conection string for your managed postgres service |
| `postgres.existingSecretName` | | Optionally set to the name of an existing Kubernetes secret (in the same namespace) that has the postgres secrets |
| `postgres.existingSecretPasswordKey` | | Optionally set to the key in the `timscale.existingSecretName` secret, contining the password (used when `postgres.deploy_postgres` is `true`) |
| `postgres.existingSecretUriKey` | | Optionally set to the key in the `timscale.existingSecretName` secret, contining the psql:// uri (used when `postgres.deploy_postgres` is `false`) |

#### Service
| Key | Default | Description |
|-----|---------|-------------|
| `slackernews.domain` | | Set to the FQDN (fully qualified domain name) you will configure for this instance
| `service.tls.existingSecretName` | | Set to an exiseting secret name that has the TLS key and cert (optional) |
| `service.tls.existingSecretCertKey` | | Set to the key in the `existingSecretName` for the cert |
| `service.tls.existingSecretKeyKey` | | Set to the key in the `existingSecretName` for the key |
| `service.tls.cert` | | Set to the value of a TLS cert | 
| `service.tls.key` | | Set to the value of a TLS key |
| `service.tls.enabled` | | Set to true to enable TLS |

#### Slack
| Key | Default | Description |
|-----|---------|-------------|
| `slack.clientId` | | Set to the clientId from your Slack app. If not provided, you will be prompted to enter this in the application after installing. |
| `slack.clientSecret` | | Set to the clientSecret from your Slack app. If not provided, you will be prompted to enter this in the application after installing. |
| `slack.botToken` | | Set to the bot token from your Slack app (starts with `xoxb-`). If not provided, you will be prompted to enter this in the application after installing. |
| `slack.userToken` | | Set to the user token from your Slack app (starts with `xoxp-`). If not provided, you will be prompted to enter this in the application after installing. |
| `slack.existingSecretName` | | Optionally, set to the name of a secret that contains the Slack values. |
| `slack.existingSecretBotTokenKey` | | Optionally, set to the name of the key in the `existingSecretName` that contains the bot token for the Slack app. |
| `slack.existingSecretUserTokenKey` | | Optionally, set to the name of the key in the `existingSecretName` that contains the user token for the Slack app. |
| `slack.existingSecretClientIdKey` | | Optionally, set to the name of the key in the `existingSecretName` that contains the clientId for the Slack app. |
| `slack.existingSecretClientSecretKey` | | Optionally, set to the name of the key in the `existingSecretName` that contains the clientSecret for the Slack app. |

### Additional values

| Key | Default | Description |
|-----|---------|-------------|
| `images.slackernews.repository` | `images.slackernews.io/proxy/slackernews/ghcr.io/slackernews/slackernews-web:1.0.5` | The container image (without the tag) to pull the SlackerNews Web image from |
| `images.slackernews.pullPolicy` | `IfNotPresent` | Image pull policy for the slackernews image |
| `images.slackernews.pullSecret` | `replicated` | The name of the image pull secret to use in the slackernews image |

