## todo-in-scope README

Extension to highlight and list specific keywords in VSCode project.

## Features

Highlight keywords:

![](./readme_files/highlight_showcase.gif)

Annotate todos in project/branch/commit:

![](./readme_files/annotations_showcase.mov)

Add pre-commit hook:

![](./readme_files/hook_showcase.mov)
## Commands

- Toggle todos highlight
  
  Enables/disables keywords highlight feature. Works only fo current session. If you want to disable it permanently - please use isEnabled setting.
- List todos in all project

  Outputs keywords, that are declared in `keywordsForAnnotation` setting, found in whole project. Take into account `includedFiles` and `excludedFiles` settings.
- List todos in current branch

  Outputs keywords, that are declared in `keywordsForAnnotation` setting, found in current branch, compared to master branch.
- List todos in current commit

  Outputs keywords, that are declared in `keywordsForAnnotation` setting, found in current commit.
- Toggle precommit hook

  Adds/removes pre-commit hook to the project. It won't allow you to commit changes if there is a keyword, declared in `keywordsForHook` settings, found in diff.

## Extension Settings

This extension contributes the following settings:

* `todo-in-scope.isEnabled`: `true` | Expected value: bool - enable/disable this extension
* `todo-in-scope.defaultStyle.color`: `black` | Expected value: web color, e.g. black/#FFF - for default keyword text color
* `todo-in-scope.defaultStyle.backgroundColor`: `yellow` | Expected value: web color, e.g. black/#FFF - for default background color of a keyword
* `todo-in-scope.defaultStyle.rulerColor`: `yellow` | Expected value: web color, e.g. black/#FFF - for default ruler color in the scroll bar
* `todo-in-scope.includedFiles`: `["**/*.rb","**/*.py","**/*.js","**/*.jsx","**/*.ts","**/*.tsx","**/*.html","**/*.php","**/*.css","**/*.scss"]` | Expected value: array of globs - for files that will be included during annotation of the whole project
* `todo-in-scope.excludedFiles`: `["**/node_modules/**","**/bower_components/**","**/dist/**","**/build/**","**/.vscode/**","**/.github/**","**/_output/**","**/*.min.*","**/*.map","**/.next/**"]` | Expected value: array of globs - for files that will be excluded during annotation of the whole project
* `todo-in-scope.maxFiles`: `2500` | Expected value: number - Max number of files that will be annotated
* `todo-in-scope.keywordsForAnnotation`: `["TODO", "DEBUG"]` | Expected value: array of strings - Keywords that will be picked during annotation
* `todo-in-scope.keywordsForHook`: `["TODO"]` | Expected value: array of strings - Keywords that will be picked for pre-commit hook
* `todo-in-scope.keywords`:
```json
[
  {
    "word": "TODO",
    "color": "white",
    "backgroundColor": "#c76d00",
    "rulerColor": "#c76d00"
  },
  {
    "word": "NOTE",
    "color": "white",
    "backgroundColor": "blue",
    "rulerColor": "blue"
  },
  {
    "word": "DEBUG",
    "color": "white",
    "backgroundColor": "red",
    "rulerColor": "red"
  }
]
```
| Expected value: array of objects. Object should consist of { word: string, color?: string, backgroundColor?: string, rulerColor?: string } - used for keywords during highlighting.

### 1.0.0

Initial release

-----------------------------------------------------------------------------------------------------------