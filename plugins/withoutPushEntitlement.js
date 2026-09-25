// Verse Keeper uses LOCAL notifications only. expo-notifications' plugin always adds the
// `aps-environment` (Push Notifications) entitlement; remove it so the app never requests
// the push capability. Mods run last-registered-first and each mod calls the previous one
// (nextMod) after its own action, so we delete the key from the finished result instead.
const { withEntitlementsPlist, withDangerousMod } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  config = withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
  // Safety net: strip the key from the written file after all entitlement mods have run.
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(c.modRequest.platformProjectRoot, c.modRequest.projectName);
      const file = path.join(dir, `${c.modRequest.projectName}.entitlements`);
      if (fs.existsSync(file)) {
        const plist = require('@expo/plist').default;
        const data = plist.parse(fs.readFileSync(file, 'utf8'));
        if (data['aps-environment']) {
          delete data['aps-environment'];
          fs.writeFileSync(file, plist.build(data));
        }
      }
      return c;
    },
  ]);
};
