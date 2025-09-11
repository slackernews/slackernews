# Installing the Preflight Plugin

The Preflight check plugin for `kubectl` helps you determine if your cluster and its surrounding environment are properly configured for a successful installation. SlackerNews uses the [Troubleshoot](https://troubleshoot.sh/) open source project to provide these checks.

## Installing the Preflight Plugin

Install the Preflight plugin using the `kubectl` plugin manager [Krew](https://krew.sigs.k8s.io/):

1. Install Krew (if you haven't already):
   ```bash
   (
     set -x; cd "$(mktemp -d)" &&
     OS="$(uname | tr '[:upper:]' '[:lower:]')" &&
     ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')" &&
     KREW="krew-${OS}_${ARCH}" &&
     curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/latest/download/${KREW}.tar.gz" &&
     tar zxvf "${KREW}.tar.gz" &&
     ./"${KREW}" install krew
   )
   ```

2. Add Krew to your PATH:
   ```bash
   export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"
   ```

3. Install the Preflight plugin:
   ```bash
   kubectl krew install preflight
   ```

4. Verify the installation:
   ```bash
   kubectl preflight version
   ```

## Installing the Plugin Without Krew

You can also install the Preflight plugin directly from the release archives:

1. Download the latest release for your platform:
   ```bash
   # For Linux (amd64)
   curl -LO https://github.com/replicatedhq/troubleshoot/releases/latest/download/preflight_linux_amd64.tar.gz
   
   # For macOS (Intel)
   curl -LO https://github.com/replicatedhq/troubleshoot/releases/latest/download/preflight_darwin_amd64.tar.gz
   
   # For macOS (Apple Silicon)
   curl -LO https://github.com/replicatedhq/troubleshoot/releases/latest/download/preflight_darwin_arm64.tar.gz
   ```

2. Extract the archive:
   ```bash
   tar xvf preflight_*.tar.gz
   ```

3. Move the binary to your kubectl plugins directory:
   ```bash
   sudo mv preflight /usr/local/bin/kubectl-preflight
   ```

4. Make it executable:
   ```bash
   sudo chmod +x /usr/local/bin/kubectl-preflight
   ```

5. Verify the installation:
   ```bash
   kubectl preflight version
   ```

## Using Preflight as a Standalone Tool

If you can't install kubectl plugins in your environment, you can download and use the standalone Preflight binary directly from the [Troubleshoot releases](https://github.com/replicatedhq/troubleshoot/releases). Visit the releases page and download the appropriate binary for your platform: `preflight_linux_amd64.tar.gz` for Linux (x86_64), `preflight_linux_arm64.tar.gz` for Linux (ARM64), `preflight_darwin_amd64.tar.gz` for macOS (Intel), or `preflight_darwin_arm64.tar.gz` for macOS (Apple Silicon).

After downloading, extract the archive with `tar xvf preflight_*.tar.gz` and make the binary executable using `chmod +x preflight`. You can then run Preflight checks directly with `./preflight <preflight-spec-url>` (you can also move it into your path). This is the same binary you would install as a preflight by renaming it to `kubectl-preflight`. The same binary works as both a Kubectl plugin and a standalone executable.
