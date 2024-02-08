"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[684],{2412:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>o,contentTitle:()=>n,default:()=>a,frontMatter:()=>s,metadata:()=>l,toc:()=>c});var d=i(7624),r=i(2172);const s={sidebar_position:2},n="EditorBridge",l={id:"api/EditorBridge",title:"EditorBridge",description:"interface of all the interactions you can do with the editor on the react native side, can be extendable with BrideExtension, with tentapStarterkit enable (also when simple usage) the EditorBridge will have:",source:"@site/docs/api/EditorBridge.md",sourceDirName:"api",slug:"/api/EditorBridge",permalink:"/10tap-editor/docs/api/EditorBridge",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/api/EditorBridge.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"useEditorBridge",permalink:"/10tap-editor/docs/api/useEditorBridge"},next:{title:"RichText",permalink:"/10tap-editor/docs/api/RichText"}},o={},c=[{value:"focus - <code>(pos?: &#39;start&#39; \\| &#39;end&#39; \\| &#39;all&#39; \\| number \\| boolean \\| null) =&gt; void</code>",id:"focus---pos-start--end--all--number--boolean--null--void",level:4},{value:"webviewRef - <code>RefObject\\&lt;WebView\\&gt;</code>",id:"webviewref---refobjectwebview",level:4},{value:"getEditorState - <code>() =&gt; BridgeState</code>",id:"geteditorstate-----bridgestate",level:4}];function h(e){const t={a:"a",code:"code",h1:"h1",h4:"h4",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,r.M)(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(t.h1,{id:"editorbridge",children:"EditorBridge"}),"\n",(0,d.jsx)(t.p,{children:"interface of all the interactions you can do with the editor on the react native side, can be extendable with BrideExtension, with tentapStarterkit enable (also when simple usage) the EditorBridge will have:"}),"\n",(0,d.jsxs)(t.h4,{id:"focus---pos-start--end--all--number--boolean--null--void",children:["focus - ",(0,d.jsx)(t.code,{children:"(pos?: 'start' \\| 'end' \\| 'all' \\| number \\| boolean \\| null) => void"})]}),"\n",(0,d.jsxs)(t.p,{children:["a function that will focus the editor and make sure to open keyboard ",(0,d.jsx)("br",{})," extend by ",(0,d.jsx)(t.a,{href:"https://10play.dev",children:"coreBridge"})]}),"\n",(0,d.jsxs)(t.h4,{id:"webviewref---refobjectwebview",children:["webviewRef - ",(0,d.jsx)(t.code,{children:"RefObject\\<WebView\\>"})]}),"\n",(0,d.jsxs)(t.p,{children:["a ref for the webview that show the editor ",(0,d.jsx)("br",{})," extend by ",(0,d.jsx)(t.a,{href:"https://10play.dev",children:"coreBridge"})]}),"\n",(0,d.jsxs)(t.h4,{id:"geteditorstate-----bridgestate",children:["getEditorState - ",(0,d.jsx)(t.code,{children:"() => BridgeState"})]}),"\n",(0,d.jsxs)(t.p,{children:["a function that will return the most up to date BridgeState ",(0,d.jsx)("br",{})," extend by ",(0,d.jsx)(t.a,{href:"https://10play.dev",children:"coreBridge"})]}),"\n",(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:"name"}),(0,d.jsx)(t.th,{children:"type"}),(0,d.jsx)(t.th,{children:"description"}),(0,d.jsx)(t.th,{children:"BrideExtension"})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"focus"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(pos?: 'start' | 'end' | 'all' | number | boolean | null) => void"})}),(0,d.jsx)(t.td,{children:"a function that will focus the editor and make sure to open keyboard"}),(0,d.jsx)(t.td,{children:"core"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"webviewRef"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"RefObject\\<WebView\\>"})}),(0,d.jsx)(t.td,{children:"a ref for the webview that show the editor"}),(0,d.jsx)(t.td,{children:"core"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"getEditorState"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => BridgeState"})}),(0,d.jsx)(t.td,{children:"a function that will return the most up to date BridgeState"}),(0,d.jsx)(t.td,{children:"core"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"getContent"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => Promise\\<string\\>"})}),(0,d.jsx)(t.td,{children:"an async function that will return the content of the editor"}),(0,d.jsx)(t.td,{children:"core"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"setContent"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(content: string) => void"})}),(0,d.jsx)(t.td,{children:"a function that get html as string and set the editor content by that"}),(0,d.jsx)(t.td,{children:"core"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"setSelection"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(from: number, to: number) => void"})}),(0,d.jsx)(t.td,{children:"a function that get position and set the selection"}),(0,d.jsx)(t.td,{children:"core"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"updateScrollThresholdAndMargin"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(offset: number) => void"})}),(0,d.jsxs)(t.td,{children:["a function that get offset in px and change ",(0,d.jsx)(t.a,{href:"https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold",children:"scrollThreshold"})," ",(0,d.jsx)(t.a,{href:"https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin",children:"scrollMargin"})]}),(0,d.jsx)(t.td,{children:"core"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleBlockquote"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle bold on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleCode"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle code block on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleItalic"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle italic on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleStrikethrough"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle strikethrough on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleBulletList"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle bullet list on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleOrderedList"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle order list on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleHeading"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(level: number) => void"})}),(0,d.jsx)(t.td,{children:"will get level and will toggle heading on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"lift"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will lift p on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"sink"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will sink p on the editor if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"undo"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will undo the last history transaction if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"redo"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will redo the last undo transaction if possible"}),(0,d.jsx)(t.td,{children:"staterKit"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"setColor"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(color: string) => void"})}),(0,d.jsx)(t.td,{children:"get color string and set it for the editor"}),(0,d.jsx)(t.td,{children:"color"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"setHighlight"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(color: string) => void"})}),(0,d.jsx)(t.td,{children:"get color string and set highlight for the editor"}),(0,d.jsx)(t.td,{children:"highlight"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"setImage"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(src: string) => void"})}),(0,d.jsx)(t.td,{children:"get image url string and set image"}),(0,d.jsx)(t.td,{children:"image"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"setLink"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"(link: string | null) => void"})}),(0,d.jsx)(t.td,{children:"get link url as string and set link, in case of null it will remove the link"}),(0,d.jsx)(t.td,{children:"link"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleTaskList"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle task list on the editor if possible"}),(0,d.jsx)(t.td,{children:"tasklist"})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:"toggleUnderline"}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:"() => void"})}),(0,d.jsx)(t.td,{children:"will toggle underline on the editor if possible"}),(0,d.jsx)(t.td,{children:"underline"})]})]})]})]})}function a(e={}){const{wrapper:t}={...(0,r.M)(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(h,{...e})}):h(e)}},2172:(e,t,i)=>{i.d(t,{I:()=>l,M:()=>n});var d=i(1504);const r={},s=d.createContext(r);function n(e){const t=d.useContext(s);return d.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:n(e.components),d.createElement(s.Provider,{value:t},e.children)}}}]);