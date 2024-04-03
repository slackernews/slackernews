import { Gauge } from 'prom-client';
import { listDailyActiveUsers, listMonthlyActiveUsers } from "../user";

const monthlyUser = new Gauge({
   name: 'slackernews_monthly_user_count',
   help: 'Slackernews monthly active user count',
});

const dailyUsers = new Gauge({
   name: 'slackernews_daily_user_count',
   help: 'Slackernews daily active user count',
});

export async function collectUserMetrics() {
  const dailyUserList = await listDailyActiveUsers();
  dailyUsers.set(dailyUserList.length);

  const monthlyUserList = await listMonthlyActiveUsers();
  monthlyUser.set(monthlyUserList.length);
}
