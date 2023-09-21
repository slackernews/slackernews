# GitHub

The GitHub integration will read and construct titles for github.com links.

For public repos and pages that are accessible, this integration will download the HTML content and use the page title.

For private repos, this will look for known URL patterns and use the GitHub Personal Access Token provided to query the GitHub  Rest API and attempt to build the title.

## History

#### v0.0.1
- Support for public pages
- Support for Issues in private repos
- Support for Pull Requests in private repos
- Support for Actions runs in private repos
