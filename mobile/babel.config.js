module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      function replaceImportMeta() {
        return {
          visitor: {
            MetaProperty(path) {
              if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                const template = require('@babel/template').default;
                const replacement = template.expression.ast(`({ env: { MODE: "${process.env.NODE_ENV || 'development'}" } })`);
                path.replaceWith(replacement);
              }
            }
          }
        };
      }
    ],
  };
};
