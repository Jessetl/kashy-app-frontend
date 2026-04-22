const { withProjectBuildGradle } = require('@expo/config-plugins');

const MARKER = '// notifee-maven-repo';
const REPO_LINE = `    maven { url rootProject.file('../node_modules/@notifee/react-native/android/libs') } ${MARKER}`;

module.exports = function withNotifeeMavenRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        'with-notifee-maven-repo: se esperaba build.gradle Groovy, encontrado ' +
          cfg.modResults.language,
      );
    }
    if (cfg.modResults.contents.includes(MARKER)) return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      (match) => `${match}\n${REPO_LINE}`,
    );
    return cfg;
  });
};
