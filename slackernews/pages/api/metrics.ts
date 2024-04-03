import { NextApiRequest, NextApiResponse } from 'next';
import { register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({ prefix: 'web_server_' });

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Content-type', register.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(await register.metrics());
}

