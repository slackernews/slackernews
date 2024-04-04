import { NextApiRequest, NextApiResponse } from 'next';
import { register, collectDefaultMetrics } from 'prom-client';
import { sendMetrics } from "../../lib/metrics/replicated";
import { collectUserMetrics, collectLicenseEntitlements } from "../../lib/metrics/prometheus";

// send custom metrics to replicated metrics when sending prometheus metrics
sendMetrics();

// prepare prometheus metrics
collectDefaultMetrics({ prefix: 'slackernews_' });
collectUserMetrics();
collectLicenseEntitlements();
collectLicenseEntitlements();

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-type', register.contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.send(await register.metrics());
}

