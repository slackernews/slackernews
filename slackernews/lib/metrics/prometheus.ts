import { Gauge } from 'prom-client';
import UserStatistics from "./user-statistics" ;
import { ReplicatedClient, LicenseField } from '../replicated-sdk';
import { SemVer } from 'semver';

const userStatistics = new UserStatistics()

const monthlyUsers = new Gauge({
   name: 'slackernews_monthly_user_count',
   help: 'Slackernews monthly active user count',
});

const dailyUsers = new Gauge({
   name: 'slackernews_daily_user_count',
   help: 'Slackernews daily active user count',
});

export async function collectUserMetrics() {
  const dailyUserCount = await userStatistics.getDailyUsers();
  dailyUsers.set(dailyUserCount);
  const monthlyUserCount = await userStatistics.getDailyUsers();
  monthlyUsers.set(monthlyUserCount);
}

const licenseEntitlement = new Gauge({
  name: 'slackernews_license_entitlement',
  help: 'Current value of an entitlement of the Slackernews license',
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
  labelNames: [ 'major', 'minor', 'patch', 'original', 'created' ],
});

async function collectCurrentVersion() {
  const appInfo = await ReplicatedClient.getAppInfo();
  const release = appInfo.currentRelease;
  try {
    const version = new SemVer(release.versionLabel, { loose: true, includePrerelease: true })

    currentVersion.set({ 
            "major": version.major,
            "minor": version.minor,
            "patch": version.patch,
            "original": version.raw,
            "created": release.createdAt
          }, new Date(release.deployedAt).getTime());
  } catch {
    console.log("version could not be parsed as semver: ", release.versionLabel);
  }
} 

const availableVersion = new Gauge({
  name: 'slackernews_available_version',
  help: 'Versions of the Slackernews that have been released but are not installed',
  labelNames: [ 'major', 'minor', 'patch', 'original', 'releaseNotes' ],
});


async function collectAvailableVersions() {
  const updates = await ReplicatedClient.getUpdates();
  for ( const update of updates ) {
    try {
      const version = new SemVer(update.versionLabel, { loose: true, includePrerelease: true })
      availableVersion.set({ 
              "major": version.major,
              "minor": version.minor,
              "patch": version.patch,
              "original": version.raw,
              "releaseNotes": update.releaseNotes
            }, new Date(update.createdAt).getTime());
    } catch {
      console.log("version could not be parsed as semver: ", update.versionLabel);
    }
  }
} 

const historicalVersion = new Gauge({
  name: 'slackernews_historical_version',
  help: 'Versions of the Slackernews that have been installed previously',
  labelNames: [ 'major', 'minor', 'patch', 'original', 'deployed' ],
});

async function collectHistoricalVersions() {
  const releaseHistory = await ReplicatedClient.getVersionHistory();
  for ( const release of releaseHistory.releases ) {
    try {
      const version = new SemVer(release.versionLabel, { loose: true, includePrerelease: true })
      historicalVersion.set({ 
              "major": version.major,
              "minor": version.minor,
              "patch": version.patch,
              "original": version.raw,
              "deployed": release.deployedAt
            }, new Date(release.createdAt).getTime());
    } catch {
      console.log("version could not be parsed as semver: ", release.versionLabel);
    }
  }
} 

export async function collectVersionMetrics() {
  await collectCurrentVersion()
  await collectAvailableVersions()
  await collectHistoricalVersions()
}
