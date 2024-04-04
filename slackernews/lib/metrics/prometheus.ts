import { Gauge } from 'prom-client';
import { listDailyActiveUsers, listMonthlyActiveUsers } from "../user";
import { ReplicatedClient, LicenseField } from '../replicated-sdk';
import { SemVer } from 'semver';

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
  labelNames: [ 'name', 'title', 'description' ],
});

export async function collectLicenseEntitlements() {
  const entitlements = await ReplicatedClient.listEntitlements();
  for ( const entitlement of entitlements ) {
    if ( entitlement.valueType === "Integer" ) {
      licenseEntitlement.set({ 
          "name": entitlement.name, 
          "title": entitlement.title
        }, entitlement.value as number);
    }
  }
}

const currentVersion = new Gauge({
  name: 'slackernews_current_version',
  help: 'The currently installed version of Slackernews',
  labelNames: [ 'major', 'minor', 'patch', 'pre', 'meta', 'original', 'deployed' ],
});

async function collectCurrentVersion() {
  console.log("collecting appinfo");
  const appInfo = await ReplicatedClient.getAppInfo();
  console.log("appInfo: ", appInfo);
  const release = appInfo.currentRelease;
  console.log("release: ", release);
  const version = new SemVer(release.versionLabel, { loose: true, includePrerelease: true })
  if ( version == null ) {
    console.log("version could not be parsed as semver: ", release.versionLabel);
  }
  console.log("setting slackernews_current_version: ", version);
  currentVersion.set({ 
          "major": version.major,
          "minor": version.minor,
          "patch": version.patch,
  //         "pre": version.prerelease
  //         "meta": version.
           "original": version.raw,
           "deployed": release.deployedAt
        }, new Date(release.createdAt).getTime()/1000 );

} 

// const availableVersion = new Gauge({
//   name: 'slackernews_available_version',
//   help: 'Versions of the Slackernews that have been released but are not installed',
//   labelNames: [ 'major', 'minor', 'patch', 'pre', 'meta', 'original' ],
// });

// async function collectAvailableVersions() {
// } 

// const historicalVersion = new Gauge({
//   name: 'slackernews_historical_version',
//   help: 'Versions of the Slackernews that have been installed previously',
//   labelNames: [ 'major', 'minor', 'patch', 'pre', 'meta', 'original' ],
// });

// async function collectHistoricalVersions() {
// } 

export async function collectVersionMetrics() {
  await collectCurrentVersion()
  // await collectAvailableVersions()
  // await collectHistoricalVersions()
}
