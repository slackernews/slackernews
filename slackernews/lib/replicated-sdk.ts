import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';

import axiosRetry from 'axios-retry';
import  { Cacheable } from 'typescript-cacheable';

axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay });

// set to the public key under settings in vendor portal
const publicKeyTxt = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzTfZBX4fDMFcDYNOrCZW
QZ6CENbG5Si2PAvRgoRrHsjW6ThBrAK61IBTtdO50ePW8VZcYKW8GzjYwjKWoDTJ
jUcHwxBpqSRHymQOj/BxE9F5TUIvNV4kwZXTtS8TWve06eRL7wPOdopRHOItG6yp
BJKArRHKGzvHdNSY50mEPerlLpHT5OEkKFox5dwV3KERM0Lx8kaKHgf2yrYdWfHm
yUKr4Vs1hi+6UWN/Bv+f5RJ0JQIjzTawLAIvDEfqIfnAfKch62Y8E8ID3l1eEhcV
YlCLaD/b+lCEdYqLc+E8mNe+RpdmCzCUrb3WICdJKSnDlotgJndsofXnELd1IQLZ
nwIDAQAB
-----END PUBLIC KEY-----`


function verifySignature(obj: LicenseField) {
  const valueType = typeof obj.value;
  const encodedMessage: Uint8Array = new TextEncoder().encode(obj.value.toString());
  const publicKey: crypto.KeyObject = crypto.createPublicKey({ key: publicKeyTxt });
  const decodedSignature: Buffer = Buffer.from(obj.signature.v1, 'base64');

  return crypto.verify('md5', encodedMessage,
  {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING
  }, decodedSignature);
}


export interface AppInfo {
  appSlug: string
  appName: string
  helmChartURL: string
  currentRelease: Release
}



export interface Release {
  versionLabel: string
  isRequired: boolean
  releaseNotes: string
  createdAt: string
  deployedAt: string
  helmReleaseName: string
  helmReleaseRevision: number
  helmReleaseNamespace: string
}


export interface VersionHistory {
	releases: Release[]
}


interface UpdateInfo {
  versionLabel: string;
  isRequired: boolean;
  createdAt: string;
  releaseNotes: string;
}


interface LicenseInfo {
  licenseID: string;
  customerEmail: string;
  customerName: string;
  assignee: string;
  channelName: string;
  licenseType: string;
}
export interface LicenseField {
  name: string
  title: string
  description: string
  value: string|number|boolean
  valueType: string
  signature: Signature
}

export interface Signature {
  v1: string
}

class ReplicatedSdk {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async getAppInfo(): Promise<AppInfo> {
    const response: AxiosResponse<AppInfo> = await axios.get(`${this.baseURL}/api/v1/app/info`);
    return response.data;
  }

  async getUpdates(): Promise<UpdateInfo[]> {
    const response: AxiosResponse<UpdateInfo[]> = await axios.get(`${this.baseURL}/api/v1/app/updates`);
    return response.data;
  }

  async getVersionHistory(): Promise<VersionHistory[]> {
    const response: AxiosResponse<VersionHistory[]> = await axios.get(`${this.baseURL}/api/v1/app/history`);
    return response.data
  }

  async getEntitlement(fieldName: string): Promise<LicenseField> {
    const response: AxiosResponse<LicenseField> = await axios.get(`${this.baseURL}/api/v1/license/fields/${fieldName}`);
    const obj = response.data;
    if (!verifySignature(obj)) {
      throw new Error('License signature verification failed');
    }
    return obj;
  }

  async listEntitlements(): Promise<LicenseField[]> {
    const response: AxiosResponse<Object> = await axios.get(`${this.baseURL}/api/v1/license/fields`);
    var entitlements: LicenseField[] = []
    for ( const [ name, field ] of Object.entries(response.data) ) {
      if (!verifySignature(field)) {
        throw new Error('License signature verification failed');
      }
      entitlements.push(field) 
    }
    return entitlements;
  }

  async getLicenseInfo(): Promise<LicenseInfo> {
    const response: AxiosResponse<LicenseInfo> = await axios.get(`${this.baseURL}/api/v1/license/info`);
    return response.data;
  }

  // Utility functions

  async getLoginToRegistryCommand(): Promise<string> {
    const licenseInfo = await this.getLicenseInfo();
    const email = licenseInfo.customerEmail;
    const passwd = licenseInfo.licenseID;
    const registryDomain = "registry.replicated.com"
    return "helm registry login " + registryDomain + " --username " + email + " --password " + passwd
  }

  // this will need to be async later, so making it async now
  async getInstallPreflightCommand(): Promise<string> {
    return "curl https://krew.sh/preflight | bash"
  }

  async getPreflightCommand(): Promise<string> {
    const registryDomain = "registry.replicated.com"
    const appInfo = await this.getAppInfo();
    return `helm template ${appInfo.helmChartURL} --values <values.yaml> | kubectl preflight`
  }


  // Get helm command to install the app
    async getUpgradeCommand(): Promise<string> {
        const appInfo = await this.getAppInfo();
        const licenseInfo = await this.getLicenseInfo();
        const registryDomain = "registry.replicated.com"
        const installCommand = `helm -n ${appInfo.currentRelease.helmReleaseNamespace} upgrade ${appInfo.currentRelease.helmReleaseName} ${appInfo.helmChartURL} --values <your_values_file.yaml>`;
        return installCommand;
    }
}

export const ReplicatedClient = new ReplicatedSdk(process.env["REPLICATED_ENDPOINT"]!)

