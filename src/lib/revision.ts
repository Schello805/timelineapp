import packageJson from "../../package.json";

export function getAppRevision() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_REVISION || process.env.APP_REVISION;
  if (fromEnv) return fromEnv;

  return packageJson.version;
}
