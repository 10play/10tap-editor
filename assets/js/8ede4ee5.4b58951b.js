"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[24],{7924:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>a,contentTitle:()=>i,default:()=>l,frontMatter:()=>d,metadata:()=>o,toc:()=>c});var s=r(7624),n=r(2172);const d={sidebar_position:7},i="DarkMode",o={id:"examples/darkTheme",title:"DarkMode",description:"In this example we will implement darkmode in the editor. This is similar to setting up custom css.",source:"@site/docs/examples/darkTheme.md",sourceDirName:"examples",slug:"/examples/darkTheme",permalink:"/10tap-editor/docs/examples/darkTheme",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7},sidebar:"tutorialSidebar",previous:{title:"Custom Keyboard",permalink:"/10tap-editor/docs/examples/customKeyboard"},next:{title:"Custom Theme",permalink:"/10tap-editor/docs/examples/customTheme"}},a={},c=[{value:"Adding Dark Theme",id:"adding-dark-theme",level:2}];function m(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,n.M)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.h1,{id:"darkmode",children:"DarkMode"}),"\n",(0,s.jsxs)(t.p,{children:["In this example we will implement darkmode in the editor. This is similar to setting up ",(0,s.jsx)(t.a,{href:"/10tap-editor/docs/examples/customCss",children:"custom css"}),"."]}),"\n",(0,s.jsx)(t.h2,{id:"adding-dark-theme",children:"Adding Dark Theme"}),"\n",(0,s.jsxs)(t.p,{children:["To customize the native theme you can use the ",(0,s.jsx)(t.code,{children:"theme"})," prop on ",(0,s.jsx)(t.code,{children:"useEditorBridge"})]}),"\n",(0,s.jsx)(t.p,{children:"If we simply want to add the existing dark mode theme you can just do"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-tsx",children:"import { ..., darkEditorTheme } from '@10play/tentap-editor';\nuseEditorBridge({\n   theme: darkEditorTheme\n});\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Now we just need to update the web-side css with ",(0,s.jsx)(t.code,{children:"extendCss"})]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-tsx",children:"import { darkEditorTheme, darkEditorCss } from '@10play/tentap-editor';\nuseEditorBridge({\n    ...\n    bridgeExtensions: [\n      ...TenTapStartKit,\n      CoreBridge.configureCSS(darkEditorCss), // <--- Add our dark mode css\n    ],\n    theme: darkEditorTheme, // <-- Add our dark mode theme\n});\n"})})]})}function l(e={}){const{wrapper:t}={...(0,n.M)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(m,{...e})}):m(e)}},2172:(e,t,r)=>{r.d(t,{I:()=>o,M:()=>i});var s=r(1504);const n={},d=s.createContext(n);function i(e){const t=s.useContext(d);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),s.createElement(d.Provider,{value:t},e.children)}}}]);