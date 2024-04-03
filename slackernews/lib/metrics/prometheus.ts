import { Gauge } from 'prom-client';
import { listDailyActiveUsers, listMonthlyActiveUsers } from "../user";

import { ReplicatedClient, LicenseField } from '../replicated-sdk';

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

const licenseEntitlement = new Gauge({
  name: 'license_entitlement',
  help: 'Slackernews license entitlement',
  labelNames: [ 'name', 'title'],
});

export async function collectLicenseEntitlements() {
  const entitlements = await ReplicatedClient.listEntitlements();
  for ( var entitlement of entitlements ) {
    var value = entitlement.value ;
    console.log(value)
    if ( typeof(value) === "number" ) {
      licenseEntitlement.set({ 
          "name": entitlement.name, 
          "title": entitlement.title
        }, entitlement.value);
    }
  }
}
