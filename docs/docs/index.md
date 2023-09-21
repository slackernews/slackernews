# Intro to SlackerNews

SlackerNews is a private news site (like Hacker News or Reddit) that is automatically populated from your company’s internal tools (Slack, Google Workspace, GitHub, Jira, Asana etc). For most companies this allows employees to easily discover this week's (or month's) most discussed documents, links, repos, issues etc.

## How it works
SlackerNews integrates into your Slack account and watches for links sent to all of your most important tools. Points are accumulated based on the number of times each link is shared, the number of threaded comments, and reactions.

Users from your Slack Workspace can sign in to your private site and view & vote up these aggregated links on a rolling basis (by default the most discussed in the last 7 days.)

SlackerNews is deployed by your team onto resources you control to ensure that you have full control over your data security & privacy.

## Standard installation
1. Satisfy the [prerequisites](/prereqs). 
2. Identify the [domain name](/domain) you want to use for your SlackerNews instance.
3. Create & install [the Slack app](/slack) to generate tokens with the right permissions.
4. Install the [Helm chart](/helm) (or use the [VM install method](/vm)).
5. Revisit the [domain step](/domain) to set up the DNS.
