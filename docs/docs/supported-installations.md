# Supported Installation Methods

SlackerNews can be installed on a Linux VM using our installer, or on a Kubernetes cluster using Helm.

## Installing on a VM (recommended)

1. Download the from the [Download Portal](https://enterprise.slackernews.io). If you need a link or credentials, please contact us at [support@slackernews.io](mailto:support@slackernews.io).

2. Extract the installer:
```shell
tar -xvzf slackernews-unstable.tgz
```

3. Run the installer:
```shell
sudo ./slackernews install --license license.yaml
```

## Installing on a Kubernetes cluster

### Using Helm

1. Install Helm 3.8 or later on your local workstation.
2. Log in to our Helm registry using the username and password provided:

```shell
helm registry login \
    chart.slackernews.io \
    --username <you@company.com> \
    --password <provided>
```

4. Install the SlackerNews chart:

```shell
helm install --namespace slackernews --create-namespace  \
    slackernews \
    oci://chart.slackernews.io/slackernews/slackernews \

```
