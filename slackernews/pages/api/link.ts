import { updateLinkTitle } from "../../lib/link";
import { listUsers } from "../../lib/user";

export default async function handler(req: any, res: any) {
  if (req.method !== 'PUT') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  await updateLinkTitle(req.body.link, req.body.title);
  res.status(200).send({});
}
