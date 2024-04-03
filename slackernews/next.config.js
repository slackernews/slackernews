const moduleExports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
  output: "standalone",
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      dns: false,
      net: false,
      tls: false,
      sequelize: false,
    };

    return config;
  },
  images: {
    domains: [
      "source.unsplash.com",
      "secure.gravatar.com",
      "avatars.slack-edge.com",
    ],
  },
  async rewrites() {
    return [
      {
        source: '/metrics',
        destination: '/api/metrics'
      }
    ]
  }
};

// default-src unsafe-eval is needed for departments page
// img-src entries are needed for the avatar images
const ContentSecurityPolicy = `
  default-src 'self';
  img-src 'self' https://secure.gravatar.com https://avatars.slack-edge.com https://*.wp.com data:;
  script-src 'self' 'unsafe-eval';
  child-src https://source.unsplash.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  connect-src 'self';
  `;

module.exports = moduleExports;
