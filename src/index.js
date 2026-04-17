import { runScaffold } from "./scaffold.js";
import { runAddApp } from "./add-app.js";

export function parseInvocation(argv) {
  if (argv[0] === "add" && argv[1] === "app") {
    const rest = argv.slice(2);
    let name = null;
    let role = null;
    for (const a of rest) {
      if (a.startsWith("--role=")) role = a.slice("--role=".length);
      else if (!a.startsWith("-") && name === null) name = a;
    }
    if (!name) throw new Error("add app: <name> is required");
    if (!role) throw new Error("add app: --role=<role> is required");
    return { kind: "add-app", name, role };
  }
  return { kind: "scaffold", rest: argv };
}

export async function runCli(argv) {
  const inv = parseInvocation(argv);
  if (inv.kind === "add-app") {
    await runAddApp({ name: inv.name, role: inv.role });
    return;
  }
  await runScaffold(inv.rest);
}
