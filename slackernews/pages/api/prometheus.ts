import { NextApiRequest, NextApiResponse } from 'next';
import { register, collectDefaultMetrics } from 'prom-client';
import { sendMetrics } from "../../lib/metrics/replicated";
import { collectUserMetrics, collectLicenseEntitlements, collectVersionMetrics } from "../../lib/metrics/prometheus";

collectDefaultMetrics({ prefix: 'slackernews_' });

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  // send custom metrics to replicated metrics when sending prometheus metrics
  sendMetrics();
  
  // prepare prometheus metrics
  collectUserMetrics();
  collectLicenseEntitlements();
  collectVersionMetrics();

  res.setHeader('Content-type', register.contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.send(await register.metrics());
}

