// Packages
import * as vscode from "vscode";

// Misc
import { Settings } from "./settings";
import * as git from "./git";
import * as systemCommands from "./system_commands";

const SCRIPT_START = "####GIT HOOK FROM TODO-IN-SCOPE VSCODE EXTENSION START####\n";
const SCRIPT_END = "####GIT HOOK FROM TODO-IN-SCOPE VSCODE EXTENSION END####\n";

export function togglePreCommitHook(settings: Settings, context: vscode.ExtensionContext) {
  // Validations
  if (!settings.isEnabled) {
    return;
  }
  if (!settings.curentFolderPath) {
    vscode.window.showErrorMessage("An open project is needed for this command to work");
    return;
  }
  if (!git.checkGitInitialized(settings.curentFolderPath)) {
    vscode.window.showErrorMessage("Git should be initialized in current project for this command to work");
    return;
  }
  systemCommands.runCommand(`touch ${settings.curentFolderPath}/.git/hooks/pre-commit`);
  if (context.globalState.get("todo-in-scope.precommit-hook-set")) {
    removeHook(settings, context);
  } else {
    addHook(settings, context);
  }
}

export function removeHook(settings: Settings, context: vscode.ExtensionContext, system: boolean = false) {
  vscode.workspace.openTextDocument(`${settings.curentFolderPath}/.git/hooks/pre-commit`).then((file) => {
    if (!file.getText().match(`${SCRIPT_START}`)) {
      if (system) { return; }
      context.globalState.update("todo-in-scope.precommit-hook-set", false);
      vscode.window.showErrorMessage("Trying to remove non-existing pre-commit hook. Please try toggle again");
      return;
    }

    let startIndex = file.getText().match(`${SCRIPT_START}`)?.index;
    let endIndex = file.getText().match(`${SCRIPT_END}`)?.index;
    if (startIndex === undefined || endIndex === undefined) {
      vscode.window.showErrorMessage("Trying to parse .git/hooks/pre-commit went wrong");
      return;
    }
    let workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.delete(file.uri, new vscode.Range(file.positionAt(startIndex), file.positionAt(endIndex + SCRIPT_END.length)));
    vscode.workspace.applyEdit(workspaceEdit);
    context.globalState.update("todo-in-scope.precommit-hook-set", false);
    vscode.window.showInformationMessage("Pre-commit hook successfully removed");
  });
}

function addHook(settings: Settings, context: vscode.ExtensionContext) {
  vscode.workspace.openTextDocument(`${settings.curentFolderPath}/.git/hooks/pre-commit`).then((file) => {
    let fileText = file.getText();
    if (fileText.match(`${SCRIPT_START}`)) {
      context.globalState.update("todo-in-scope.precommit-hook-set", true);
      vscode.window.showErrorMessage("Trying to add a pre-commit hook, when it was already added. Please try toggle again");
      return;
    }

    let textEdits: vscode.TextEdit[] = [];
    if (fileText === "") {
      textEdits.push(vscode.TextEdit.insert(file.positionAt(0), "#!/bin/sh\n"));
    }
    textEdits.push(vscode.TextEdit.insert(file.positionAt(file.getText().length), buildScript(settings)));
    let workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(file.uri, textEdits);
    vscode.workspace.applyEdit(workspaceEdit);
    systemCommands.runCommand(`chmod +x ${file.uri.path}`);
    context.globalState.update("todo-in-scope.precommit-hook-set", true);
    vscode.window.showInformationMessage("Pre-commit hook successfully added");
  });
}

export function reapplyHook(settings: Settings, context: vscode.ExtensionContext) {
  if (!context.globalState.get("todo-in-scope.precommit-hook-set")) {
    return;
  }

  vscode.workspace.openTextDocument(`${settings.curentFolderPath}/.git/hooks/pre-commit`).then((file) => {
    let startIndex = file.getText().match(`${SCRIPT_START}`)?.index;
    let endIndex = file.getText().match(`${SCRIPT_END}`)?.index;
    if (startIndex === undefined || endIndex === undefined) {
      vscode.window.showErrorMessage("Trying to parse .git/hooks/pre-commit went wrong");
      return;
    }
    let workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.replace(
      file.uri,
      new vscode.Range(file.positionAt(startIndex), file.positionAt(endIndex + SCRIPT_END.length)),
      buildScript(settings)
    );
    vscode.workspace.applyEdit(workspaceEdit);
  });
}

function buildScript(settings: Settings): string {
  return SCRIPT_START +
    'todo_lines="";\n' +
    'while read st file; do\n' +
    '  if [ "$st" == \'D\' ]; then continue; fi\n' +
    '  new_lines=$(git diff --cached -U0 -w ${file} 2>/dev/null | egrep -oi \'^@@ .+ \\+(\\d+)(,(\\d+)){0,1} @@\' | egrep -oi \'\\+\\d+(,\\d+){0,1}\');\n' +
    '  if [ "$new_lines" == "" ]; then continue; fi\n' +
    '  new_lines_arr=($new_lines);\n' +
    '  file_appended=false;\n' +
    '  for index in "${!new_lines_arr[@]}"\n' +
    '  do\n' +
    '    line_and_count=$(egrep -oi \'\\d+(,\\d+){0,1}\' <<< "${new_lines_arr[index]}");\n' +
    '    IFS="," read -a line_and_count_arr <<< $line_and_count;\n' +
    '    line_and_count=($line_and_count_arr);\n' +
    '    if [ "${#line_and_count[@]}" = 1 ]; then line_and_count[${#line_and_count[@]}]=0; fi\n' +
    '    line_and_count_sum="$((line_and_count[0] + line_and_count[1]))";\n' +
    '    line_range=($(seq ${line_and_count[0]} $line_and_count_sum));\n' +
    '    for line in "${line_range[@]}"\n' +
    '    do\n' +
    '      file_line="$(awk NR==${line} ${file})";\n' +
    `      todo_line="$(egrep -i \'${settings.buildRegexp("hook")}\' <<< $file_line)";\n` +
    '      if [ "$todo_line" == "" ]; then continue; fi\n' +
    '      if [ "$file_appended" = false ];\n' +
    '      then\n' +
    '        todo_lines+="${file}\\n";\n' +
    '        file_appended=true;\n' +
    '      fi\n' +
    '      todo_lines+="\\t${line}: ${todo_line}\\n";\n' +
    '    done\n' +
    '  done\n' +
    'done <<< "$(git diff --cached --name-status)"\n' +
    'if [ "$todo_lines" == "" ]; then exit 0; fi\n' +
    'echo "Todo-in-scope found unresolved todos:"\n' +
    'printf "$todo_lines";\n' +
    'exit 1;\n' +
    SCRIPT_END;
}