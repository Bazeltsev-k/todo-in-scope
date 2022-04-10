// Packages
import * as vscode from "vscode";
import * as child_process from "child_process";

export function runCommand(command: string): string {
  try { 
    return child_process.execSync(command).toString();
  } catch(e: any) {
    vscode.window.showErrorMessage("Internal extension error");
    throw new Error(e);
  }
}