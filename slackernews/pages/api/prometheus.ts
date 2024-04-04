import { NextApiRequest, NextApiResponse } from 'next';
import { register, collectDefaultMetrics } from 'prom-client';
import { sendMetrics } from "../../lib/metrics/replicated";
import { collectUserMetrics, collectLicenseEntitlements } from "../../lib/metrics/prometheus";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  // send custom metrics to replicated metrics when sending prometheus metrics
  await sendMetrics();

  // prepare prometheus metrics
  await collectDefaultMetrics({ prefix: 'slackernews_' });
  await collectUserMetrics();
  await collectLicenseEntitlements();
  await collectLicenseEntitlements();

  res.setHeader('Content-type', register.contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.send(await register.metrics());
}

