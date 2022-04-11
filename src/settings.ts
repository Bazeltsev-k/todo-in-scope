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

const DEFAULT_INCLUDED_FILES = [
  "**/*.rb",
  "**/*.py",
  "**/*.js",
  "**/*.jsx",
  "**/*.ts",
  "**/*.tsx",
  "**/*.html",
  "**/*.php",
  "**/*.css",
  "**/*.scss"
];
const DEFAULT_EXCLUDED_FILES = [
  "**/node_modules/**",
  "**/bower_components/**",
  "**/dist/**",
  "**/build/**",
  "**/.vscode/**",
  "**/.github/**",
  "**/_output/**",
  "**/*.min.*",
  "**/*.map",
  "**/.next/**"
];
const DEFAULT_MAX_FILES = 2500;
const DEFAULT_KEYWORDS_FOR_ANNOTATION = ["TODO", "DEBUG"];
const DEFAULT_KEYWORDS_FOR_HOOK = ["TODO"];
const DEFAULT_ENABLED = true;

export class Settings {
  constructor(
    public isEnabled: boolean,
    public defaultStyle: vscode.DecorationRenderOptions,
    public includedFiles: string,
    public excludedFiles: string,
    public maxFiles: number,
    public keywordsForAnnotation: string[],
    public keywordsForHook: string[],
    public keywords: Keyword = {},
    public tmpDecorationTypes: DecorationTypes = {},
    public curentFolderPath: string = "",
    public outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel("Todos in scope"),
    public mainBranch: string = "master"
  ) {}

  buildRegexp(useCase: string = "decoration"): RegExp | string {
    let usedKeywords = "";
    switch(useCase) {
      case "decoration": {
        usedKeywords = Object.keys(this.keywords).join("|");
        break;
      }
      case "annotation": {
        usedKeywords = this.keywordsForAnnotation.join("|");
        break;
      }
      case "hook": {
        return `^ {0,}.+(${this.keywordsForHook.join("|")})(\\(\\w+\\)){0,}:.+$`;
      }
    }
    return new RegExp(`^ {0,}.+(${usedKeywords})(\\(\\w+\\)){0,}:.+$`, "gm");
  }

  static settingsFromConfig(): Settings {
    let workspace = vscode.workspace;
    let configuration = workspace.getConfiguration("todo-in-scope");
    let defaultStyle = configuration.get("defaultStyle") as DefaultStyleIo;
    let defaultIncludedFiles = configuration.get("includedFiles") as string[] || DEFAULT_INCLUDED_FILES;
    let defaultExcludedFiles = configuration.get("excludedFiles") as string[] || DEFAULT_EXCLUDED_FILES;
    let settings = new Settings(
      configuration.get("isEnabled") || DEFAULT_ENABLED,
      { color: defaultStyle.color, backgroundColor: defaultStyle.backgroundColor, overviewRulerColor: defaultStyle.rulerColor },
      `{${defaultIncludedFiles.join(",")}}`,
      `{${defaultExcludedFiles.join(",")}}`,
      configuration.get("maxFiles") || DEFAULT_MAX_FILES,
      configuration.get("keywordsForAnnotation") || DEFAULT_KEYWORDS_FOR_ANNOTATION,
      configuration.get("keywordsForHook") || DEFAULT_KEYWORDS_FOR_HOOK
    );
    (configuration.get("keywords") as any[]).forEach(keyword => {
      settings.keywords[keyword.word] = {
        color: keyword.color || defaultStyle.color,
        backgroundColor: keyword.backgroundColor || defaultStyle.backgroundColor,
        overviewRulerColor: keyword.rulerColor || defaultStyle.rulerColor
      };
    });
    settings.mainBranch = configuration.get("mainBranch") || "master";
    if (!settings.outputChannel) {
      settings.outputChannel = vscode.window.createOutputChannel("Todos in scope");
    }

    let folders = vscode.workspace.workspaceFolders;
    if (folders) {
      settings.curentFolderPath = folders[0].uri.path;
    }
    return settings;
  }
}
