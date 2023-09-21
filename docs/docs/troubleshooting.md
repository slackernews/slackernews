# Troubleshooting SlackerNews

Sometimes things aren't working right and we've included some built-in tools to help troubleshoot your installation.

## Support bundles

The first place to start troubleshooting is to collect a support bundle. A support bundle is a single archive that has redacted logs, metrics, and other data about the installation. Application data and sensitive information (IP addresses, passwords, etc) are all automatically redacted from this archive. 

### Using admin console
If you have deployed SlackerNews with the optional App Manager you should be able to navigate to `<yourdomain>:8800` or by running `kubectl kots admin-console -n slackernews` (or into whatever namespace you're using) and then navigating to the "Troubleshoot" tab. 

### Using the CLI
If you don't have access to the admin console, you can also collect the same support bundle from the CLI, assuming you have `kubectl` access to the cluster:

```
kubectl krew install support-bundle
kubectl support-bundle oci://registry.replicated.com/slackernews/unstable
```

The CLI will tell you where the archive is saved. If the built-in analyzers don't solve your problem, please contact us and send the support bundle archive for our team to look at.
