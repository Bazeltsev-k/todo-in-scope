import * as vscode from "vscode";

export interface DecorationTypes {
  [key: string]: {
    decoration: vscode.TextEditorDecorationType, ranges: vscode.Range[]
  }
};

export interface DefaultStyleIo {
  color: "string",
  backgroundColor: "string",
  rulerColor: "string"
}

export class Settings {
  constructor(
    public isEnabled: boolean = true,
    public defaultStyle: vscode.DecorationRenderOptions,
    public keywords: { [key: string]: vscode.DecorationRenderOptions },
    public tmpDecorationTypes: DecorationTypes = {}
  ) {}
}
