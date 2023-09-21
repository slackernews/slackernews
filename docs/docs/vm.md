# Virtual machine installation

If you don't have access to an existing Kubernetes cluster, you can install SlackerNews into a VM (where an embedded version of Kubernetes will be installed as part of the app installation process).

## Supported operating systems

We recommend Ubuntu 20.04, but also support the following operating systems:

- Ubuntu 18.04, 20.04 
- CentOS 7.4 and up (but not CentOS Stream)
- RHEL 7 and RHEL 8
- Oracle Linux 7.4 - 8.5
- Amazon Linux 2

## Machine size

We recommend 16 GB of RAM and 4 cores minimum. 
We recommend at least 100 GB of persistent, SSD disk to run.    

## Installing

```
curl -sSL https://k8s.kurl.sh/slackernews | sudo bash
```

Follow the CLI instructions about any preflight check warnings and then guiding you to port `:8800` for a UI-based configuration experience. You'll need to upload the license file that was generate for you and you should have already followed the instructions to on how to [create your Slack app](/slack) to generate the necessary tokens.


