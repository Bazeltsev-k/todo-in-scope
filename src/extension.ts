// Packages
import * as vscode from "vscode";

// Misc
import * as misc from "./misc";

export function activate(context: vscode.ExtensionContext) {
  let workspace = vscode.workspace;
  let window = vscode.window;
  let settings = misc.initSettings();
  let activeEditor = window.activeTextEditor;

  // Commands
	context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.toggle-highlight", () => {
      misc.toggleHighlight(activeEditor, settings);
	  })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.toggle-highlight", () => {
      vscode.window.showErrorMessage("TODO: add functionality for this command");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.annotate-project", () => {
      vscode.window.showErrorMessage("TODO: add functionality for this command");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.annotate-branch", () => {
      vscode.window.showErrorMessage("TODO: add functionality for this command");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-in-scope.annotate-commit", () => {
      vscode.window.showErrorMessage("TODO: add functionality for this command");
    })
  );

  misc.applyDecorations(activeEditor, settings);

  // Handlers
  window.onDidChangeActiveTextEditor((editor) => {
    if(activeEditor = editor) {
      misc.applyDecorations(activeEditor, settings);
    }
  }, null, context.subscriptions);

  workspace.onDidChangeConfiguration((event) => {
    settings = misc.initSettings();
    // TODO: toggle highlight when disabled
    misc.applyDecorations(activeEditor, settings);
  }, null, context.subscriptions);

  workspace.onDidChangeTextDocument((event) => {
    if(activeEditor && event.document === activeEditor.document) {
      misc.applyDecorations(activeEditor, settings);
    }
  }, null, context.subscriptions);
}

export function deactivate() {}
