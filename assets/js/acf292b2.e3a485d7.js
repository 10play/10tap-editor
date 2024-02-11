"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[684],{2412:(e,i,t)=>{t.r(i),t.d(i,{assets:()=>o,contentTitle:()=>d,default:()=>g,frontMatter:()=>s,metadata:()=>l,toc:()=>h});var r=t(7624),n=t(2172);const s={sidebar_position:2},d="EditorBridge",l={id:"api/EditorBridge",title:"EditorBridge",description:"interface of all the interactions you can do with the editor on the react native side, can be extendable with BrideExtension, with tentapStarterkit enable (also when simple usage) the EditorBridge will have:",source:"@site/docs/api/EditorBridge.md",sourceDirName:"api",slug:"/api/EditorBridge",permalink:"/10tap-editor/docs/api/EditorBridge",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/api/EditorBridge.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"useEditorBridge",permalink:"/10tap-editor/docs/api/useEditorBridge"},next:{title:"BridgeState",permalink:"/10tap-editor/docs/api/BridgeState"}},o={},h=[{value:"focus",id:"focus",level:4},{value:"webviewRef",id:"webviewref",level:4},{value:"getEditorState",id:"geteditorstate",level:4},{value:"getContent",id:"getcontent",level:4},{value:"setContent",id:"setcontent",level:4},{value:"setSelection",id:"setselection",level:4},{value:"updateScrollThresholdAndMargin",id:"updatescrollthresholdandmargin",level:4},{value:"toggleBlockquote",id:"toggleblockquote",level:4},{value:"toggleCode",id:"togglecode",level:4},{value:"toggleItalic",id:"toggleitalic",level:4},{value:"toggleStrikethrough",id:"togglestrikethrough",level:4},{value:"toggleBulletList",id:"togglebulletlist",level:4},{value:"toggleOrderedList",id:"toggleorderedlist",level:4},{value:"toggleHeading",id:"toggleheading",level:4},{value:"lift",id:"lift",level:4},{value:"sink",id:"sink",level:4},{value:"undo",id:"undo",level:4},{value:"redo",id:"redo",level:4},{value:"setColor",id:"setcolor",level:4},{value:"setHighlight",id:"sethighlight",level:4},{value:"setImage",id:"setimage",level:4},{value:"setLink",id:"setlink",level:4},{value:"toggleTaskList",id:"toggletasklist",level:4},{value:"toggleUnderline",id:"toggleunderline",level:4}];function c(e){const i={a:"a",code:"code",h1:"h1",h4:"h4",p:"p",...(0,n.M)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(i.h1,{id:"editorbridge",children:"EditorBridge"}),"\n",(0,r.jsx)(i.p,{children:"interface of all the interactions you can do with the editor on the react native side, can be extendable with BrideExtension, with tentapStarterkit enable (also when simple usage) the EditorBridge will have:"}),"\n",(0,r.jsx)(i.h4,{id:"focus",children:"focus"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(pos?: 'start' \\| 'end' \\| 'all' \\| number \\| boolean \\| null) => void"}),(0,r.jsx)("br",{}),"\na function that will focus the editor and make sure to open keyboard ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#coreextension",children:"CoreBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"webviewref",children:"webviewRef"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"RefObject\\<WebView\\>"}),(0,r.jsx)("br",{}),"\na ref for the webview that show the editor ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#coreextension",children:"CoreBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"geteditorstate",children:"getEditorState"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => BridgeState"}),(0,r.jsx)("br",{}),"\na function that will return the most up to date BridgeState ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#coreextension",children:"CoreBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"getcontent",children:"getContent"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => Promise\\<string\\>"}),(0,r.jsx)("br",{}),"\nan async function that will return the content of the editor ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#coreextension",children:"CoreBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"setcontent",children:"setContent"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(content: string) => void"}),(0,r.jsx)("br",{}),"\na function that get html as string and set the editor content by that ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#coreextension",children:"CoreBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"setselection",children:"setSelection"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(from: number, to: number) => void"}),(0,r.jsx)("br",{}),"\na function that get position and set the selection ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#coreextension",children:"CoreBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"updatescrollthresholdandmargin",children:"updateScrollThresholdAndMargin"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(offset: number) => void"}),(0,r.jsx)("br",{}),"\na function that get offset in px and change ",(0,r.jsx)(i.a,{href:"https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold",children:"scrollThreshold"})," ",(0,r.jsx)(i.a,{href:"https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin",children:"scrollMargin"})," ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#coreextension",children:"CoreBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"toggleblockquote",children:"toggleBlockquote"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle bold on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#blockquotebridge",children:"BlockquoteBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"togglecode",children:"toggleCode"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle code block on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#codebridge",children:"CodeBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"toggleitalic",children:"toggleItalic"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle italic on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#italicbridge",children:"ItalicBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"togglestrikethrough",children:"toggleStrikethrough"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle strikethrough on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#strikebridge",children:"StrikeBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"togglebulletlist",children:"toggleBulletList"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle bullet list on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#bulletlistbridge",children:"BulletListBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"toggleorderedlist",children:"toggleOrderedList"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle order list on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#orderedlistbridge",children:"OrderListBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"toggleheading",children:"toggleHeading"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(level: number) => void"})," ",(0,r.jsx)("br",{}),"will get level and will toggle heading on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#headingbridge",children:"HeadingBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"lift",children:"lift"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will lift p on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#listitembridge",children:"ListItemBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"sink",children:"sink"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will sink p on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#listitembridge",children:"ListItemBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"undo",children:"undo"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will undo the last history transaction if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#historybridge",children:"HistoryBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"redo",children:"redo"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will redo the last undo transaction if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#historybridge",children:"HistoryBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"setcolor",children:"setColor"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(color: string) => void"})," ",(0,r.jsx)("br",{}),"get color string and set it for the editor ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#colorbridge",children:"ColorBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"sethighlight",children:"setHighlight"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(color: string) => void"})," ",(0,r.jsx)("br",{}),"get color string and set highlight for the editor ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#highlightbridge",children:"HighlightBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"setimage",children:"setImage"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(src: string) => void"})," ",(0,r.jsx)("br",{}),"get image url string and set image ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#imagebridge",children:"ImageBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"setlink",children:"setLink"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"(link: string \\| null) => void"})," ",(0,r.jsx)("br",{}),"get link url as string and set link, in case of null it will remove the link ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#linkbridge",children:"LinkBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"toggletasklist",children:"toggleTaskList"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle task list on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#tasklistbridge",children:"TaskListBridge"})]}),"\n",(0,r.jsx)(i.h4,{id:"toggleunderline",children:"toggleUnderline"}),"\n",(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.code,{children:"() => void"})," ",(0,r.jsx)("br",{}),"will toggle underline on the editor if possible ",(0,r.jsx)("br",{})," extend by ",(0,r.jsx)(i.a,{href:"./BridgeExtensions#underlinebridge",children:"UnderlineBridge"})]})]})}function g(e={}){const{wrapper:i}={...(0,n.M)(),...e.components};return i?(0,r.jsx)(i,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},2172:(e,i,t)=>{t.d(i,{I:()=>l,M:()=>d});var r=t(1504);const n={},s=r.createContext(n);function d(e){const i=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function l(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:d(e.components),r.createElement(s.Provider,{value:i},e.children)}}}]);