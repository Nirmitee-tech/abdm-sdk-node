// This file is used to configure pnpm specific settings.
// For more information, see: https://pnpm.io/pnpmfile

if (!process.versions.pnp) {
  console.warn('Warning: This project is using pnpm but PnP is not enabled.');
  console.warn('Consider enabling PnP for better performance and reliability.');
}

module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // Ensure consistent TypeScript version
      if (pkg.dependencies && pkg.dependencies.typescript) {
        context.log('Overriding TypeScript version to ^5.0.0');
        pkg.dependencies.typescript = '^5.0.0';
      }
      
      // Ensure consistent @types/node version
      if (pkg.devDependencies && pkg.devDependencies['@types/node']) {
        pkg.devDependencies['@types/node'] = '^18.0.0';
      }
      
      return pkg;
    },
  },
};

// Configure pnpm to use the same node_modules structure as npm
process.env.PNPM_HOME = `${process.env.HOME}/.pnpm`;
process.env.PNPM_STORE_DIR = `${process.env.HOME}/.pnpm-store`;
