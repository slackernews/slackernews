# Supported Installation Methods

SlackerNews can be installed on a Linux VM using our installer, or on a
Kubernetes cluster using Helm. Both installation methods are described on the
[SlackerNews Enterprise Portal](https://enterprise.slackernews.io). We
recommend you follow the installation instructions on the Enterprise Portal
for your specific installation method and environment.

Below is an overview of each installation method for reference.

## Installing on a VM (recommended)

To install SlackerNews on a VM, you'll need to download the installer from the [SlackerNews Enterprise Portal](https://enterprise.slackernews.io). After download, you will
1. Download the from the [Enterprise Portal](If you need a link or credentials, please contact us at [support@slackernews.io](mailto:support@slackernews.io).

1. Extract the installer:
```shell
tar -xvzf slackernews-unstable.tgz
```

2. Run the installer:
```shell
sudo ./slackernews install --license license.yaml
```

3. Connect to the SlackerNews Admin Console UI which will guide your through
   the rest of the installation process.

## Installing on a Kubernetes cluster

### Using Helm

1. Assure you have [Helm](https://helm.sh/docs/intro/install/),
   [kubectl](https://kubernetes.io/docs/tasks/tools/), and
   [the preflight plugin for `kubectl`](/prefight) installed.

2. Prepare [install values](/values) for your installation. 

3. Log in to our Helm registry using the username and password provided on the
   [SlackerNews Enterprise Portal](https://enterprise.slackernews.io):

```shell
helm registry login \
    chart.slackernews.io \
    --username <you@company.com> \
    --password <provided>
```

4. Run preflight checks to ensure that your cluster is ready to install
   SlackerNews:

```shell
helm template oci://chart.slackernews.io/slackernews/slackernews \
    --values values.yaml \
  | kubectl preflight -f -
```

4. Install the SlackerNews chart:

```shell
helm install --namespace slackernews --create-namespace  \
    slackernews \
    oci://chart.slackernews.io/slackernews/slackernews \
    --values values.yaml

```
