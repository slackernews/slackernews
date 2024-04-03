import { listDailyActiveUsers, listMonthlyActiveUsers } from "../user";


export async function sendMetrics(): Promise<any> {
  if (process.env.REPLICATED_ENABLED !== "true") {
    return;
  }

  const dailyUsers = await listDailyActiveUsers();
  const monthlyUsers = await listMonthlyActiveUsers();

  const licenseId = await getLicenseId();

  const res = await fetch(`${process.env["REPLICATED_ENDPOINT"]}/api/v1/app/custom-metrics`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": licenseId,
      },
      body: JSON.stringify({
        data: {
          dailyUsers: dailyUsers.length,
          monthlyUsers: monthlyUsers.length,
        }
      }),
    });

  if (res.status >= 300) {
    throw new Error(`Error sending metrics: ${res.status}`);
  }
}

async function getLicenseId(): Promise<string> {
  const res = await fetch(`${process.env["REPLICATED_ENDPOINT"]}/api/v1/license/info`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!data) {
    throw new Error("No license found");
  }

  return data.licenseID;
}
