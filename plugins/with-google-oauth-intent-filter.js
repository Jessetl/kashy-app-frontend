const { withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const GOOGLE_CLIENT_SUFFIX = '.apps.googleusercontent.com';

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function findGoogleAndroidClientId(projectRoot, androidPackage) {
  const googleServicesPath = path.join(projectRoot, 'google-services.json');
  if (!fs.existsSync(googleServicesPath)) {
    return null;
  }

  const raw = fs.readFileSync(googleServicesPath, 'utf8');
  const parsed = JSON.parse(raw);
  const clients = toArray(parsed.client);

  for (const client of clients) {
    const packageName =
      client?.client_info?.android_client_info?.package_name ?? null;

    if (androidPackage && packageName && packageName !== androidPackage) {
      continue;
    }

    const oauthClients = toArray(client?.oauth_client);
    const androidOAuth = oauthClients.find((oauth) => oauth?.client_type === 1);

    if (androidOAuth?.client_id) {
      return androidOAuth.client_id;
    }
  }

  return null;
}

function createGoogleScheme(clientId) {
  if (!clientId || !clientId.endsWith(GOOGLE_CLIENT_SUFFIX)) {
    return null;
  }

  const withoutSuffix = clientId.slice(0, -GOOGLE_CLIENT_SUFFIX.length);
  return `com.googleusercontent.apps.${withoutSuffix}`;
}

function hasAction(intentFilter, actionName) {
  return toArray(intentFilter?.action).some(
    (action) => action?.$?.['android:name'] === actionName,
  );
}

function hasCategory(intentFilter, categoryName) {
  return toArray(intentFilter?.category).some(
    (category) => category?.$?.['android:name'] === categoryName,
  );
}

function addSchemeToIntentFilter(intentFilter, scheme) {
  const dataEntries = toArray(intentFilter.data);
  const alreadyExists = dataEntries.some(
    (entry) => entry?.$?.['android:scheme'] === scheme,
  );

  if (alreadyExists) {
    intentFilter.data = dataEntries;
    return;
  }

  dataEntries.push({ $: { 'android:scheme': scheme } });
  intentFilter.data = dataEntries;
}

function findMainActivity(application) {
  const activities = toArray(application.activity);

  return activities.find((activity) =>
    toArray(activity['intent-filter']).some(
      (intentFilter) =>
        hasAction(intentFilter, 'android.intent.action.MAIN') &&
        hasCategory(intentFilter, 'android.intent.category.LAUNCHER'),
    ),
  );
}

function findOrCreateViewIntentFilter(mainActivity) {
  const intentFilters = toArray(mainActivity['intent-filter']);

  const existing = intentFilters.find(
    (intentFilter) =>
      hasAction(intentFilter, 'android.intent.action.VIEW') &&
      hasCategory(intentFilter, 'android.intent.category.BROWSABLE') &&
      hasCategory(intentFilter, 'android.intent.category.DEFAULT'),
  );

  if (existing) {
    mainActivity['intent-filter'] = intentFilters;
    return existing;
  }

  const created = {
    action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
    category: [
      { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
    ],
    data: [],
  };

  intentFilters.push(created);
  mainActivity['intent-filter'] = intentFilters;
  return created;
}

module.exports = function withGoogleOAuthIntentFilter(config) {
  return withAndroidManifest(config, (cfg) => {
    const androidPackage = cfg.android?.package;
    const clientId = findGoogleAndroidClientId(
      cfg.modRequest.projectRoot,
      androidPackage,
    );

    const googleScheme = createGoogleScheme(clientId);
    if (!googleScheme) {
      return cfg;
    }

    const application = cfg.modResults?.manifest?.application?.[0];
    if (!application) {
      return cfg;
    }

    const mainActivity = findMainActivity(application);
    if (!mainActivity) {
      return cfg;
    }

    const viewIntentFilter = findOrCreateViewIntentFilter(mainActivity);
    addSchemeToIntentFilter(viewIntentFilter, googleScheme);

    return cfg;
  });
};
