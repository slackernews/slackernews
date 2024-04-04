import { NextApiRequest, NextApiResponse } from 'next';
import { register, collectDefaultMetrics } from 'prom-client';
import { sendMetrics } from "../../lib/metrics/replicated";
import { collectUserMetrics, collectLicenseEntitlements, collectVersionMetrics } from "../../lib/metrics/prometheus";

// send replicated metrics when sending prometheus metrics
sendMetrics();

collectDefaultMetrics({ prefix: 'slackernews_' });
collectUserMetrics();
collectLicenseEntitlements();
collectVersionMetrics();

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Content-type', register.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(await register.metrics());
}

