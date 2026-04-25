import { execSync } from "node:child_process";
import packageJson from "../../package.json";

export function getAppRevision() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_REVISION || process.env.APP_REVISION;
  if (fromEnv) return fromEnv;

  try {
    const count = execSync("git rev-list --count HEAD", {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
    const hash = execSync("git rev-parse --short HEAD", {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();

    return `${count} (${hash})`;
  } catch {
    return packageJson.version;
  }
}
