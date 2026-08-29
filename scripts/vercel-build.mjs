import { spawnSync } from "node:child_process";

export function selectVercelBuildScript(environment) {
  return environment === "production" ? "build:production" : "build";
}

const selectedScript = selectVercelBuildScript(process.env.VERCEL_ENV);

if (process.argv.includes("--print")) {
  process.stdout.write(`${selectedScript}\n`);
} else {
  // Vercel has one project-wide command; only production has release secrets.
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["run", selectedScript], {
    env: process.env,
    stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
}
