/** @type {import('next').NextConfig} */
const webpack = require('webpack');

// Add console log to check the environment variables at build time
console.log('NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY exists:', !!process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY);

const nextConfig = {
  /* config options here */
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    // Only apply in the browser build
    if (!isServer) {
      // Handle node: protocol imports
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          process: require.resolve('process/browser'),
          zlib: require.resolve('browserify-zlib'),
          stream: require.resolve('stream-browserify'),
          util: require.resolve('util'),
          buffer: require.resolve('buffer'),
          assert: require.resolve('assert'),
          fs: false,
          path: require.resolve('path-browserify'),
          os: require.resolve('os-browserify/browser'),
          crypto: require.resolve('crypto-browserify'),
        },
        alias: {
          ...config.resolve.alias,
          'node:process': require.resolve('process/browser'),
          'node:stream': require.resolve('stream-browserify'),
          'node:buffer': require.resolve('buffer'),
          'node:util': require.resolve('util'),
          'node:crypto': require.resolve('crypto-browserify'),
          'node:path': require.resolve('path-browserify'),
          'node:os': require.resolve('os-browserify/browser'),
        }
      };

      // Add plugins
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        // More aggressive approach to handle node: imports
        new webpack.NormalModuleReplacementPlugin(
          /^node:(.*)$/,
          (resource) => {
            const mod = resource.request.replace(/^node:/, '');
            if (mod === 'process') {
              resource.request = 'process/browser';
            } else if (mod === 'stream') {
              resource.request = 'stream-browserify';
            } else if (mod === 'buffer') {
              resource.request = 'buffer';
            } else if (mod === 'util') {
              resource.request = 'util';
            } else if (mod === 'crypto') {
              resource.request = 'crypto-browserify';
            } else if (mod === 'path') {
              resource.request = 'path-browserify';
            } else if (mod === 'os') {
              resource.request = 'os-browserify/browser';
            } else {
              resource.request = mod;
            }
          }
        )
      );
    }

    return config;
  },
};

module.exports = nextConfig; 