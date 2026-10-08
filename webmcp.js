// Optional browser-native tools share the exact same match state and UI actions.
export function registerMatchTools(context, { getStatus, control }) {
  if (!context?.registerTool) return () => {};
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{ /* Normal browsers may not implement the proposed API. */ }};
  register({name:'get_match_status',title:'Get match status',description:'Read the visible match phase, remaining time, fighter names, health and score. Does not return captured photos.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input={}){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('No input properties are accepted.');return getStatus();}});
  register({name:'control_match',title:'Control match',description:'Start a new round from the lobby or result, pause an active round, or resume a paused round.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','pause','resume']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length!==1||!['start','pause','resume'].includes(input.action))throw new Error('Choose start, pause, or resume.');control(input.action);return getStatus();}});
  return ()=>lifecycle.abort();
}
