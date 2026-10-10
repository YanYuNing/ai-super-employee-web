export const permissions={ADMIN:'*',PRODUCT:'product.manage',DOWNLOAD:'download.manage',PROMPT:'prompt.manage',SKILL:'skill.manage'} as const;
export function hasPermission(role:string|undefined,permission:string){return role==='SUPER_ADMIN'||role==='ADMIN';}
