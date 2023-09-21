import { listUsers } from "../../lib/user";

export default async function handler(req: any, res: any) {
  const slackernewsUsers = await listUsers();

  res.status(200).send({users: slackernewsUsers});
}
