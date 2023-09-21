# Telemetry

Telemetry data is shared from your SlackerNews instance to our team regularly.

We use the data for the following purposes:

1. To identify security and reliability issues.
2. To analyze and fix software problems.
3. To help improve the quality of our software and related services.
4. To make design decisions for future releases.

Telemetry data is encrypted in transit, does not include personally identifiable information or message contents, and details of how the information is used and processed is available in our Privacy Policy.

## What we collect

The following data & metrics are collected once every 24 hours:

1. Versions of SlackerNews & bundled services
2. Versions and type of server operating system and/or Kubernetes clustser
3. Provided license ID
4. The generated instance ID of the deployment
5. Database type & version
6. Number of users (int)
7. Daily active users (int)
8. Accumulated daily point total (int)
9.  Count of the links discovered per day (int)
10. Count of the unique domains referenced (int)
11. The highest point score per day (int)
12. Total points to date (int)
13. Preflight check status (pass/warn/fail)
14. Number of nodes installed on (if embedded cluster installation) (int)
15. Service health status
16. The IP address of the request (indicates which cloud provider is used)
   