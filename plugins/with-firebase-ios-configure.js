const { withAppDelegate } = require('@expo/config-plugins');

const MARKER = '// firebase-ios-configure';
const CONFIGURE_BLOCK = `    // Inicializa Firebase antes que cualquier otra cosa para evitar warnings
    // de "Default FirebaseApp not configured" en @react-native-firebase/messaging.
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    } ${MARKER}
`;

/**
 * Inyecta FirebaseApp.configure() al inicio de
 * application(_:didFinishLaunchingWithOptions:) en AppDelegate.swift.
 *
 * @react-native-firebase/app v21 delega la inicialización a su +load method,
 * pero añadir configure() explícitamente evita condiciones de carrera y
 * warnings en logs cuando RNFBMessaging arranca antes que Firebase Core.
 */
module.exports = function withFirebaseIosConfigure(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error(
        'with-firebase-ios-configure: se esperaba AppDelegate.swift, encontrado ' +
          cfg.modResults.language,
      );
    }
    if (cfg.modResults.contents.includes(MARKER)) return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /(public override func application\([^)]*\n\s*_ application: UIApplication,\n\s*didFinishLaunchingWithOptions[^)]*\)\s*->\s*Bool\s*\{\n)/,
      (match) => `${match}${CONFIGURE_BLOCK}`,
    );
    return cfg;
  });
};
