# Preparing Your Installation Values

When installing SlackerNews with Helm, you'll need to provide a values file
that configures SlackerNews for your environment. You do not need to create a
values file when isntalling on a VM, since the Admin Console will guide you
through providing the required configuration.

!!! Note
    
    For demo mode installations, you can install without providing any of the
    values below, unless you need to access the images from your own registry.

## Required values

### Core configuration

The core configuration required for SlackerNews is the [domain name](/domain)
for the instance and a comma-separated list of email addresses for the users
who can administer it.

```yaml
slackernews:
  domain:             # your domain name
  adminUserEmails:    # the emails for your administrators, these must match the emails they use to login to Slack
```

### TLS certificates

SlackerNews requires [TLS certificates signed by a trusted certificate
authority](/domain) for Slack to connect securely to your instance. You should
supply the certificates as a base64 encoded string.

```yaml
service:
  tls:
    enabled: true
    cert:                  # base64 encoded certificate
    key:                   # base64 encoded key  
    ca:                    # base64 encoded certificate authority
```

### Slack configuration

You must [install the SlackerNews app into your Slack workspace](/slack) to
use SlackerNews outside of demo mode. When you configure the app, Slack will
give you the credentials you need to configure SlackerNews to connect. You use
these values to provide them.

```yaml
slack:
  clientId:            # OAuth client ID
  clientSecret:        # OAuth client secret
  botToken: xoxb-...   # bot OAuth token
  userToken: xoxp-...  # user OAuth token
```
### Configuring access to SlackerNews

For you team to access SlackerNews, you need to configure access the NGINX
service that serves up the SlackerNews application. The easiest way to do this
is to take advantaged of the `LoadBalancer` service type, which will create
the appropriate load balancer configuration to send trffic to the NGINX
service. 

```yaml
nginx:
    service:
      type: LoadBalancer
```
The next best way to configure access is to use an ingress controller.
SlackerNews allows you to specify an ingress using the following values. Be
sure to add and annotations your ingress controller needs.

```yaml
ingress:
  enabled: true
  ingressClassName:    # ingress class name
  annotations:         # the annotations your ingress controller requires
```

You may also choose to configure the services as a `NodePort` service. This is
the default for virtual machines installations and less common when installing
into existing clusters. You are most likely to  use this approach if you use
an external load balancer that you will manually configure to route traffic to
the service.

```yaml
nginx:
  service:
    type: NodePort
    nodePort:
      port:            # the port to use for the NodePort service type
```

Regardless of how you route traffic to SlackerNews, make sure you configure
the [domain name](/domain) for the instance to point at the right address.

## Using your own registry

SlackerNews pulls the images it uses from the Replicated Proxy Registry, which
uses your license as credentials to access the appropriate container images
(and their signatures, SBOMs, etc.). You may have policies in your
organization that limit your clusters from accessing registries outside of an
approved list, or you may be running in an air-gapped environment where it is
impossible to access the internet.

In these cases, you will need to load the images into an appropriate registry
following the instructions on the [SlackerNews Enterprise
Portal](https://enterprise.slackernews.io). Once you have the images into your
registry, you will need to provide the following values to access them.

```yaml
images:
  pullSecrets:
    - name:                  # pull secret with credentails for your registry
  slackernews:
    registry:                # your registry host
    repository:              # the repository for the slackernews-web image in your registry
  nginx:
    registry:                # your registry host
    repository:              # the repository for the nginx image in your registry
  postgres:
    registry:                # your registry host
    repository:              # the repository for the postgresql image in your registry

replicated:
  imagePullSecrets:
    - name:                  # pull secret with credentails for your registry
  image:
    registry:                # your registry host
    repository:              # the repository for the replicated SDK image in your registry
```

## Using an existing database

SlackerNews uses a Postgres database to store and track activity on shared
links. The standard Helm chart includes a containerized version of Postgres to
run, and defaults to enabling this.

It may be preferrable to run your own Postgres database in production. If you
want to run Postgres outside of the cluster, use the following values

```yaml
postgres:
  deploy_postgres: false    # do not deploy postgres from the chart
  uri: postgres://...       # the connection string for your postgres database
```
