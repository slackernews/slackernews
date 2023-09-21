import { sendMetrics } from "../../lib/metrics/metric";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  // check for the right random token
  if (req.body.token !== process.env.METRICS_TOKEN) {
    console.error("metrics token mismatch");
    res.status(401).send({ ok: false, error: 'Unauthorized' });
    return;
  }

  await sendMetrics();
  res.status(200).send({ ok: true });
}
