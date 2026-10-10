import path from "path";
export const uploadRoot=path.join(process.cwd(),"public","uploads");
export function uploadCategory(name:string){return path.join(uploadRoot,name);}
