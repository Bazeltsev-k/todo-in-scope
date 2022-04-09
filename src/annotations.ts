// Packages
import * as vscode from "vscode";

// Misc
import { Settings } from "./settings";
import * as child_process from "child_process";

export function annotate(scope: string, settings: Settings) {
  // Validations
  if (!settings.isEnabled) {
    return;
  }
  let folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    vscode.window.showErrorMessage("An open project is needed for this command to work");
    return;
  }
  settings.curentFolderPath = folders[0].uri.path;
  if (["branch", "commit"].includes(scope) && !checkGitInitialized(settings.curentFolderPath)) {
    vscode.window.showErrorMessage("Git should be initialized in current project for this command to work");
    return;
  }
  showAnnotations(scope, settings);
}

function showAnnotations(scope: string, settings: Settings) {
  switch(scope) {
    case "project": {
      showAnnotationsForProject(settings);
      break;
    }
    case "branch": {
      showAnnotationsForBranch(settings);
      break;
    }
    case "commit": {
      showAnnotationsForCommit(settings);
      break;
    }
  }
}

function showAnnotationsForCommit(settings: Settings) {
  let diffFiles = runCommand(`git -C ${settings.curentFolderPath} diff --name-only`).trim().split("\n");
  if (diffFiles.length === 0) {
    vscode.window.showInformationMessage("No diff found");
  }
  showAnnotationsForGit(
    settings, diffFiles,
    (filePath) => runCommand(`git -C ${settings.curentFolderPath} diff ${filePath}`)
  );
}

function showAnnotationsForBranch(settings: Settings) {
  let mainBranch = "master";
  let diffFiles = runCommand(`git -C ${settings.curentFolderPath} diff ${mainBranch} --name-only`).trim().split("\n");
  if (diffFiles.length === 0) {
    vscode.window.showInformationMessage(`No diff between current branch and ${mainBranch}`);
  }
  showAnnotationsForGit(
    settings, diffFiles,
    (filePath) => runCommand(`git -C ${settings.curentFolderPath} diff ${mainBranch}:${filePath} ${filePath}`)
  );
}

function showAnnotationsForGit(settings: Settings, diffFiles: string[], gitCommand: (filePath: string) => string) {
  let filePathsDiffs: { [key: string]: number[][] } = {};
  // iterate over files in diff and gather diff ranges
  for (let filePath of diffFiles) {
    let fileDiff = gitCommand(filePath);
    // '@@ -18,6 +18,23 @@', '18,23', index: 169 => "18,23" => ["18", "23"] => [18 - line number, 23 - count]
    let diffRanges = [...fileDiff.matchAll(new RegExp("^@@.+\\+(\\d+,\\d+) @@", "gm"))]
      .map((match) => match[1].split(",").map(str => parseInt(str)))
      .map(arr => range(arr[0], arr[0] + arr[1]));
    filePathsDiffs[filePath] = diffRanges;
  }

  let outputChannel = vscode.window.createOutputChannel("Todos in scope");
  textDocumentsFromMatchedFiles(
    settings, `{${diffFiles.join(",")}}`, settings.excludedFiles,
    (filePath, line, match) => {
      let fileRanges = filePathsDiffs[filePath.replace(`${settings.curentFolderPath}/`, "")];
      if (!fileRanges) {
        return;
      }
      if (anyRangeIncludes(fileRanges, line)) {
        outputChannel.appendLine(`${filePath}:${line} : \n\t${match}`);
      }
    },
    () => outputChannel.append(""),
    () => outputChannel.show()
  );
}

function showAnnotationsForProject(settings: Settings) {
  let outputChannel = vscode.window.createOutputChannel("Todos in scope");

  textDocumentsFromMatchedFiles(
    settings, settings.includedFiles, settings.excludedFiles,
    (filePath, line, match) => {
      outputChannel.appendLine(`${filePath}:${line + 1} : \n\t${match}`);
    },
    () => outputChannel.append(""),
    () => outputChannel.show()
  );
}

function textDocumentsFromMatchedFiles(
  settings: Settings, includeGlob: string, excludeGlob: string | undefined = undefined,
  matchCallback: (filePath: string, line: number, match: string) => void,
  afterEachFileCallback: () => void,
  afterAllFilesCallback: () => void
) {
  vscode.workspace.findFiles(includeGlob, excludeGlob, settings.maxFiles).then((files) => {
    files.forEach((file) => {
      vscode.workspace.openTextDocument(file).then((file) => {
        for (let match of file.getText().matchAll(settings.buildRegexp(true))) {
          let line: vscode.TextLine | undefined = undefined;
          if (match.index) {
            line = file.lineAt(file.positionAt(match.index));
          }
          matchCallback(file.uri.path, (line?.lineNumber || 0) + 1, match[0].trim());
        }
      });
      afterEachFileCallback();
    });
    afterAllFilesCallback();
  });
}

function checkGitInitialized(path: string) {
  try { 
    child_process.execSync(`[ -d ${path}/.git ] && echo .git >&1`);
  } catch(Error) {
    return false;
  }
  return true;
}

function range(start: number, end: number): number[] {
  return Array.from({length: (end - start)}, (v, k) => k + start);
}

function anyRangeIncludes(ranges: number[][], num: number): boolean {
  for (let range of ranges) {
    for (let rangeNum of range) {
      if (rangeNum === num) {
        return true;
      }
    }
  }
  return false;
}

function runCommand(command: string): string {
  try { 
    return child_process.execSync(command).toString();
  } catch(e: any) {
    vscode.window.showErrorMessage(e.message);
    throw new Error("Something went wrong");
  }
}