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

interface Keyword {
  [key: string]: vscode.DecorationRenderOptions
}
export class Settings {
  constructor(
    public isEnabled: boolean = true,
    public defaultStyle: vscode.DecorationRenderOptions,
    public keywords: Keyword = {},
    public tmpDecorationTypes: DecorationTypes = {},
    public curentFolderPath: string = "",
    private regExp: RegExp | undefined = undefined
  ) {}

  buildRegexp(): RegExp {
    if (this.regExp) {
      return this.regExp;
    }

    let keywordString = Object.keys(this.keywords).join("|");
    return this.regExp = new RegExp(`^ {0,}.+(${keywordString})(\\(\\w+\\)){0,}:.+$`, "gm");
  }

  static settingsFromConfig(): Settings {
    let workspace = vscode.workspace;
    let configuration = workspace.getConfiguration("todo-in-scope");
    let defaultStyle = configuration.get("defaultStyle") as DefaultStyleIo;
    let settings = new Settings(
      configuration.get("isEnabled"),
      { color: defaultStyle.color, backgroundColor: defaultStyle.backgroundColor, overviewRulerColor: defaultStyle.rulerColor }
    );
    (configuration.get("keywords") as any[]).forEach(keyword => {
      settings.keywords[keyword.word] = {
        color: keyword.color || defaultStyle.color,
        backgroundColor: keyword.backgroundColor || defaultStyle.backgroundColor,
        overviewRulerColor: keyword.rulerColor || defaultStyle.rulerColor
      };
    });

    return settings;
  }
}
