export default config;

interface ChainsOptions {
  layer1: string;
  layer2: string;
}

interface UrlsOptions {
  appStoreLink: string | undefined;
  googlePlayLink: string | undefined;
}

/**
 * Type declarations for
 *    import config from 'my-app/config/environment'
 */
declare const config: {
  environment: string;
  modulePrefix: string;
  podModulePrefix: string;
  locationType: string;
  rootURL: string;
  chains: ChainsOptions;
  urls: UrlsOptions;
  APP: Record<string, unknown>;
};
