import { listWorkspaceUsers } from "../../../lib/slack";

export default async function handler(req: any, res: any) {
  const include = req.query.include.split(",");
  let includeAccounts: boolean = include.includes("slack");
  let includeGuests: boolean = include.includes("guest");

  const workspaceUsers = await listWorkspaceUsers(includeAccounts, includeGuests);

  res.status(200).send({users: workspaceUsers});
}
