import { walk, WalkEntry } from "https://deno.land/std@0.192.0/fs/walk.ts";
import { globToRegExp } from "https://deno.land/std@0.192.0/path/glob.ts";

async function main() {
  const baseFolder = Deno.args[0] || ".";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeBaseName = baseFolder.replace(/[:\/\\]/g, "_");
  const outputFilename = `output${timestamp}_${safeBaseName}.txt`;
  let ignorePatterns: string[] = [];
  try {
    const gitignoreContent = await Deno.readTextFile(
      `${baseFolder}/.gitignore`
    );
    const lines = gitignoreContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"));

    ignorePatterns = lines;

    console.log("Loaded patterns from .gitignore:");
    console.log(lines);
  } catch (error) {
    console.warn(
      "No .gitignore found or unable to read it. Proceeding without ignore patterns."
    );
  }

  function shouldSkip(entry: WalkEntry): boolean {
    if (entry.name.startsWith(".") || entry.path.startsWith(".")) {
      return true;
    }

    for (const pattern of ignorePatterns) {
      if (entry.name.includes(pattern) || entry.path.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  console.log(`Scanning folder (relative): ${baseFolder}`);

  let combinedOutput = "";
  let fileCount = 0;

  for await (const entry of walk(baseFolder)) {
    if (!entry.isFile || shouldSkip(entry)) {
      continue;
    }

    try {
      const fileContent = await Deno.readTextFile(entry.path);
      combinedOutput += `// ${entry.path}\n${fileContent}\n\n`;
      console.log(`Processed: ${entry.path}`);
      fileCount++;
    } catch (error) {
      console.error(`Error reading file ${entry.path}: ${error}`);
    }
  }

  if (fileCount === 0) {
    console.warn(
      "No valid files were found or processed. Please check your folder or .gitignore patterns."
    );
  } else {
    console.log(`Total files processed: ${fileCount}`);
  }

  await Deno.writeTextFile(outputFilename, combinedOutput, { append: false });
  console.log(`Output saved to: ${outputFilename}`);
}

main();
