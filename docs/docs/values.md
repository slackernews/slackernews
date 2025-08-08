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
  domain:  # your domain name
  adminUserEmails: # the emails for your administrators, these must match the emails they use to login to Slack
```

### TLS certificates

SlackerNews requires [TLS certificates signed by a trusted certificate
authority](/domain) for Slack to connect securely to your instance. You should
supply the certificates as a base64 encoded string.

```yaml
service:
  tls:
    enabled: true
    cert: repl{{ ConfigOptionData "tls_cert" | nindent 14 }}
    key: repl{{ ConfigOptionData "tls_key" | nindent 14 }}
    ca: repl{{ ConfigOptionData "tls_ca" | nindent 14 }}
```

### Slack configuration

    slack:
      botToken: repl{{ ConfigOption "slack_bot_token" | quote }}
      userToken: repl{{ ConfigOption "slack_user_token" | quote }}
      clientId: repl{{ ConfigOption "slack_clientid" | quote }}
      clientSecret: repl{{ ConfigOption "slack_clientsecret" | quote }}

### Configuring access to SlackerNews

      nginx:
          service:
            type: ClusterIP

      nginx:
        service:
          type: NodePort
          nodePort:
            port: repl{{ ConfigOption "node_port_port" }}

    <!-- add in ingress -->

## Using your own registry

    images:
      pullSecrets:
        - name: '{{repl ImagePullSecretName }}'
      slackernews:
        registry: '{{repl HasLocalRegistry | ternary LocalRegistryHost "$REGISTRY" }}'
        repository: '{{repl HasLocalRegistry | ternary LocalRegistryNamespace (print "proxy/" (LicenseFieldValue "appSlug") "/ghcr.io/$NAMESPACE" ) }}/slackernews-web'
      nginx:
        registry: '{{repl HasLocalRegistry | ternary LocalRegistryHost "$REGISTRY" }}'
        repository: '{{repl HasLocalRegistry | ternary LocalRegistryNamespace (print "proxy/" (LicenseFieldValue "appSlug") "/cve0.io" ) }}/nginx'
      postgres:
        registry: '{{repl HasLocalRegistry | ternary LocalRegistryHost "$REGISTRY" }}'
        repository: '{{repl HasLocalRegistry | ternary LocalRegistryNamespace (print "proxy/" (LicenseFieldValue "appSlug") "/cve0.io" ) }}/postgres'
 
    replicated:
      imagePullSecrets:
        - name: '{{repl ImagePullSecretName }}'
      image:
        registry: '{{repl HasLocalRegistry | ternary LocalRegistryHost "$REGISTRY" }}'
        repository: '{{repl HasLocalRegistry | ternary LocalRegistryNamespace "library/replicated-sdk-image"}}'

## Using an existing database

        postgres:
          uri: '{{repl ConfigOption "postgres_external_uri" }}'

