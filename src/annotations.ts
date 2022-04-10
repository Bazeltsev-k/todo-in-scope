// Packages
import * as vscode from "vscode";

// Misc
import { Settings } from "./settings";
import * as git from "./git";
import * as systemCommands from "./system_commands";

export function annotate(scope: string, settings: Settings) {
  // Validations
  if (!settings.isEnabled) {
    return;
  }
  if (!settings.curentFolderPath) {
    vscode.window.showErrorMessage("An open project is needed for this command to work");
    return;
  }
  if (["branch", "commit"].includes(scope) && !git.checkGitInitialized(settings.curentFolderPath)) {
    vscode.window.showErrorMessage("Git should be initialized in current project for this command to work");
    return;
  }
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Annotating files",
    cancellable: false
  }, (progress) => {
    progress.report({ message: "Going through files, picking todos" });
    return showAnnotations(scope, settings) as Thenable<any>;
  });
}

function showAnnotations(scope: string, settings: Settings) : Thenable<any> | undefined {
  switch(scope) {
    case "project": {
      return showAnnotationsForProject(settings);
    }
    case "branch": {
      return showAnnotationsForBranch(settings);
    }
    case "commit": {
      return showAnnotationsForCommit(settings);
    }
  }
  return undefined;
}

function showAnnotationsForCommit(settings: Settings) : Thenable<any> {
  let diffFiles = systemCommands.runCommand(`git -C ${settings.curentFolderPath} diff --name-only --cached`).trim().split("\n");
  if (diffFiles.length === 1 && diffFiles[0] === "") {
    vscode.window.showInformationMessage("No diff found");
  }
  return showAnnotationsForGit(
    settings, diffFiles,
    (filePath) => systemCommands.runCommand(`git -C ${settings.curentFolderPath} diff --cached -U0 ${filePath}`)
  );
}

function showAnnotationsForBranch(settings: Settings) : Thenable<any> {
  let mainBranch = "master";
  let diffFiles = systemCommands.runCommand(`git -C ${settings.curentFolderPath} diff ${mainBranch} --name-only`).trim().split("\n");
  if (diffFiles.length === 0) {
    vscode.window.showInformationMessage(`No diff between current branch and ${mainBranch}`);
  }
  return showAnnotationsForGit(
    settings, diffFiles,
    (filePath) => systemCommands.runCommand(`git -C ${settings.curentFolderPath} diff ${mainBranch}:${filePath} ${filePath}`)
  );
}

function showAnnotationsForGit(settings: Settings, diffFiles: string[], gitCommand: (filePath: string) => string) : Thenable<any> {
  let filePathsDiffs: { [key: string]: number[][] } = {};
  // iterate over files in diff and gather diff ranges
  for (let filePath of diffFiles) {
    let fileDiff = gitCommand(filePath);
    // '@@ -18,6 +18,23 @@', '18,23', index: 169 => "18,23" => ["18", "23"] => [18 - line number, 23 - count]
    let diffRanges = [...fileDiff.matchAll(new RegExp("^@@.+\\+(\\d+(,\\d+){0,1}) @@", "gm"))]
      .map((match) => match[1].split(",").map(str => parseInt(str)))
      .map((arr) => {
        if (arr.length === 1) {
          arr.push(0);
        }
        return arr;
      })
      .map(arr => range(arr[0], arr[0] + arr[1]));
    filePathsDiffs[filePath] = diffRanges;
  }

  settings.outputChannel.clear();
  return textDocumentsFromMatchedFiles(
    settings, `{${diffFiles.join(",")}}`, settings.excludedFiles,
    (filePath, line, match) => {
      let fileRanges = filePathsDiffs[filePath.replace(`${settings.curentFolderPath}/`, "")];
      if (!fileRanges) {
        return;
      }
      if (anyRangeIncludes(fileRanges, line)) {
        settings.outputChannel.appendLine(`${filePath}:${line} : \n\t${match}`);
      }
    },
    () => settings.outputChannel.append(""),
    () => settings.outputChannel.show()
  );
}

function showAnnotationsForProject(settings: Settings) : Thenable<any> {
  settings.outputChannel.clear();

  return textDocumentsFromMatchedFiles(
    settings, settings.includedFiles, settings.excludedFiles,
    (filePath, line, match) => {
      settings.outputChannel.appendLine(`${filePath}:${line} : \n\t${match}`);
    },
    () => settings.outputChannel.append(""),
    () => settings.outputChannel.show()
  );
}

function textDocumentsFromMatchedFiles(
  settings: Settings, includeGlob: string, excludeGlob: string | undefined = undefined,
  matchCallback: (filePath: string, line: number, match: string) => void,
  afterEachFileCallback: () => void,
  afterAllFilesCallback: () => void
) : Thenable<any> {
  return new Promise<void>(resolve => {
    vscode.workspace.findFiles(includeGlob, excludeGlob, settings.maxFiles).then((files) => {
      files.forEach((file) => {
        vscode.workspace.openTextDocument(file).then((file) => {
          for (let match of file.getText().matchAll(settings.buildRegexp("annotation") as RegExp)) {
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
      resolve();
    });
  });
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