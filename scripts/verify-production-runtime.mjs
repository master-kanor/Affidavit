import { spawn } from "node:child_process";

const port = process.env.VERIFY_PORT || "3101";
const child = spawn(process.execPath, ["dist/index.js"], {
  env: { ...process.env, PORT: port },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForExit = () => new Promise((resolve) => {
  if (child.exitCode !== null) {
    resolve();
    return;
  }
  const finish = () => resolve();
  child.once("exit", finish);
  setTimeout(finish, 1000).unref();
});

try {
  await sleep(800);
  const response = await fetch(`http://127.0.0.1:${port}/`);
  if (!response.ok) {
    throw new Error(`Expected HTTP 2xx, received ${response.status}`);
  }
  const body = await response.text();
  if (!body.includes("Official Affidavit of Evidence")) {
    throw new Error("Production response did not contain the expected landing-page title");
  }
  console.log(`Production runtime health check passed on port ${port}: HTTP ${response.status}`);
} finally {
  child.kill("SIGTERM");
  await waitForExit();
  if (output.trim()) console.log(output.trim());
}
