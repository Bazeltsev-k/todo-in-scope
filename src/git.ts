import * as child_process from "child_process";

export function checkGitInitialized(path: string) {
  try { 
    child_process.execSync(`[ -d ${path}/.git ] && echo .git >&1`);
  } catch(Error) {
    return false;
  }
  return true;
}