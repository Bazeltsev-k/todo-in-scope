// Packages
import * as vscode from "vscode";

// Misc
import { Settings } from "./settings";
import * as decorations from "./decorations";
import * as annotations from "./annotations";
import * as commitHooks from "./commit_hooks";

export function activate(context: vscode.ExtensionContext) {
  let workspace = vscode.workspace;
  let window = vscode.window;
  let settings = Settings.settingsFromConfig();
  let activeEditor = window.activeTextEditor;

  // Commands
	context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.toggle-highlight", () => {
      decorations.toggleHighlight(activeEditor, settings);
	  })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.annotate-project", () => {
      annotations.annotate("project", settings);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.annotate-branch", () => {
      annotations.annotate("branch", settings);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.annotate-commit", () => {
      annotations.annotate("commit", settings);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.toggle-precommit-hook", () => {
      commitHooks.togglePreCommitHook(settings, context);
    })
  );

  decorations.applyDecorations(activeEditor, settings);

  // Handlers
  window.onDidChangeActiveTextEditor((editor) => {
    if(activeEditor = editor) {
      decorations.applyDecorations(activeEditor, settings);
    }
  }, null, context.subscriptions);

  workspace.onDidChangeConfiguration((event) => {
    settings = Settings.settingsFromConfig();
    if (settings.isEnabled) {
      decorations.applyDecorations(activeEditor, settings);
      commitHooks.reapplyHook(settings, context);
    } else {
      decorations.clearDecorations(settings.tmpDecorationTypes);
      commitHooks.removeHook(settings, context, true);
    }
  }, null, context.subscriptions);

  workspace.onDidChangeTextDocument((event) => {
    if(activeEditor && event.document === activeEditor.document) {
      decorations.applyDecorations(activeEditor, settings);
    }
  }, null, context.subscriptions);
}

export function deactivate() {}
