"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[364],{8716:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>s,default:()=>h,frontMatter:()=>r,metadata:()=>d,toc:()=>a});var i=t(7624),o=t(2172);const r={sidebar_position:7},s="useEditorContent",d={id:"api/useEditorContent",title:"useEditorContent",description:"The useEditorContent hook is designed to efficiently retrieve the content. It monitors changes to the editor's content, and reduces unnecessary data exchanges between web and native, optimizing performance and minimizing message traffic.",source:"@site/docs/api/useEditorContent.md",sourceDirName:"api",slug:"/api/useEditorContent",permalink:"/10tap-editor/docs/api/useEditorContent",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7},sidebar:"tutorialSidebar",previous:{title:"Built-in BridgeExtensions",permalink:"/10tap-editor/docs/api/BridgeExtensions"},next:{title:"Basic example",permalink:"/10tap-editor/docs/examples/basic"}},c={},a=[{value:"editor",id:"editor",level:4},{value:"options",id:"options",level:3},{value:"type",id:"type",level:4},{value:"debounceInterval",id:"debounceinterval",level:4},{value:"Usage",id:"usage",level:3}];function l(e){const n={br:"br",code:"code",h1:"h1",h3:"h3",h4:"h4",p:"p",pre:"pre",...(0,o.M)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"useeditorcontent",children:"useEditorContent"}),"\n",(0,i.jsx)(n.p,{children:"The useEditorContent hook is designed to efficiently retrieve the content. It monitors changes to the editor's content, and reduces unnecessary data exchanges between web and native, optimizing performance and minimizing message traffic."}),"\n",(0,i.jsx)(n.h4,{id:"editor",children:"editor"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"EditorBridge"})," (",(0,i.jsx)("u",{children:"required"}),")"]}),"\n",(0,i.jsx)(n.h3,{id:"options",children:"options"}),"\n",(0,i.jsx)(n.h4,{id:"type",children:"type"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"EditorContentType"}),"\nThe type of content to return, ",(0,i.jsx)(n.code,{children:"html"})," and ",(0,i.jsx)(n.code,{children:"text"})," return strings, ",(0,i.jsx)(n.code,{children:"json"})," returns an object."]}),"\n",(0,i.jsx)(n.h4,{id:"debounceinterval",children:"debounceInterval"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"number"}),(0,i.jsx)(n.br,{}),"\n",(0,i.jsx)("u",{children:"default"}),": ",(0,i.jsx)(n.code,{children:"10"}),(0,i.jsx)("br",{})]}),"\n",(0,i.jsx)(n.h3,{id:"usage",children:"Usage"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-tsx",children:"const content = useEditorContent(editor, { type: 'html' });\nuseEffect(() => {\n  // Will render each time content is updated and call onSave\n  content && onSave(content);\n}, [content]);\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Internally ",(0,i.jsx)(n.code,{children:"useEditorContent"})," will get the content by calling ",(0,i.jsx)(n.code,{children:"editor.getHTML"})," (or text/json depending on the ",(0,i.jsx)(n.code,{children:"type"})," option). To reduce\ntraffic it is called within a ",(0,i.jsx)(n.code,{children:"debounce"})," with a default interval of ",(0,i.jsx)(n.code,{children:"10"}),"ms. This can be modified changing the ",(0,i.jsx)(n.code,{children:"debounceInterval"})," option."]}),"\n",(0,i.jsx)(n.p,{children:"In addition we can also get the content as text or as a json."})]})}function h(e={}){const{wrapper:n}={...(0,o.M)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},2172:(e,n,t)=>{t.d(n,{I:()=>d,M:()=>s});var i=t(1504);const o={},r=i.createContext(o);function s(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:s(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);