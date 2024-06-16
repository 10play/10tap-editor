"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[328],{9404:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>d,contentTitle:()=>r,default:()=>p,frontMatter:()=>a,metadata:()=>s,toc:()=>l});var n=i(7624),o=i(2172);const a={sidebar_position:1},r="10tap-editor",s={id:"intro",title:"10tap-editor",description:'TenTap is a typed, easy to use, customizable, and extendable Rich Text editor for React-Native based on Tiptap and Prosemirror. It offers a "plug and play" experience and comes with many essential features out of the box that can be incorporated into your apps quickly. Additionally, TenTap allows you the developers to tailor the editor to your applications specific needs.',source:"@site/docs/intro.md",sourceDirName:".",slug:"/intro",permalink:"/10tap-editor/docs/intro",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",next:{title:"Main Concept",permalink:"/10tap-editor/docs/mainConcepts"}},d={},l=[{value:"Why?",id:"why",level:2},{value:"Docs and Examples",id:"docs-and-examples",level:2},{value:"Installation",id:"installation",level:2},{value:"React Native",id:"react-native",level:3},{value:"Expo",id:"expo",level:3},{value:"Usage",id:"usage",level:2},{value:"Contributing",id:"contributing",level:2},{value:"License",id:"license",level:2}];function c(e){const t={a:"a",br:"br",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",ul:"ul",...(0,o.M)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"10tap-editor",children:"10tap-editor"}),"\n",(0,n.jsx)("img",{src:"/10tap-editor/img/cover.webp",alt:"cover"}),"\n",(0,n.jsx)("a",{href:"https://github.com/10play/10tap-editor/blob/main/LICENSE",children:(0,n.jsx)("img",{src:"https://img.shields.io/badge/License-MIT-blue.svg",alt:"MIT License"})}),"\n",(0,n.jsx)("a",{href:"https://www.npmjs.com/package/@10play/tentap-editor",children:(0,n.jsx)("img",{src:"https://img.shields.io/npm/v/@10play/tentap-editor.svg",alt:"npm"})}),"\n",(0,n.jsx)(t.p,{children:'TenTap is a typed, easy to use, customizable, and extendable Rich Text editor for React-Native based on Tiptap and Prosemirror. It offers a "plug and play" experience and comes with many essential features out of the box that can be incorporated into your apps quickly. Additionally, TenTap allows you the developers to tailor the editor to your applications specific needs.'}),"\n",(0,n.jsx)(t.h1,{id:"features",children:"Features"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"\ud83d\udc81 Based on tiptap"}),"\n",(0,n.jsx)(t.li,{children:"\u2795 Extendable"}),"\n",(0,n.jsx)(t.li,{children:"\ud83c\udfb9 Custom keyboards"}),"\n",(0,n.jsx)(t.li,{children:"\u2699\ufe0f Support dynamic scheme"}),"\n",(0,n.jsx)(t.li,{children:"\ud83d\udee0\ufe0f Native toolbar"}),"\n",(0,n.jsx)(t.li,{children:"\ud83d\udc85 Customizable styles"}),"\n",(0,n.jsx)(t.li,{children:"\ud83c\udf12 Darkmode and custom theme support"}),"\n",(0,n.jsx)(t.li,{children:"\ud83c\udfd7\ufe0f supports new architecture*"}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"* new arch supported on react-native version 0.73.5 and above"}),"\n",(0,n.jsx)(t.h2,{id:"why",children:"Why?"}),"\n",(0,n.jsx)(t.p,{children:"After years of developing rich text editors for mobile, we realized that there is an empty void for open source RichText editors on mobile especially for ReactNative. So we have decided to create this package that incorporates all that we have learned, and that provides the best possible ux. Tentap is designed for getting the best experience of editing rich-text on mobile inspired by state of the art mobile editors like: gdocs, notion, dropbox paper."}),"\n",(0,n.jsx)(t.h2,{id:"docs-and-examples",children:"Docs and Examples"}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.a,{href:"https://10play.github.io/10tap-editor/docs/intro.html",children:"Click Here For Full Documentation"})}),"\n",(0,n.jsx)(t.h2,{id:"installation",children:"Installation"}),"\n",(0,n.jsx)(t.h3,{id:"react-native",children:"React Native"}),"\n",(0,n.jsxs)(t.ol,{children:["\n",(0,n.jsx)(t.li,{children:(0,n.jsx)(t.code,{children:"yarn add @10play/tentap-editor react-native-webview"})}),"\n",(0,n.jsx)(t.li,{children:(0,n.jsx)(t.code,{children:"cd ios && pod install"})}),"\n"]}),"\n",(0,n.jsx)(t.h3,{id:"expo",children:"Expo"}),"\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"npx expo install @10play/tentap-editor react-native-webview"}),(0,n.jsx)(t.br,{}),"\n","Only basic usage without custom keyboard is supported by Expo Go (see ",(0,n.jsx)(t.a,{href:"/10tap-editor/docs/examples/basic",children:"basic example"}),").",(0,n.jsx)(t.br,{}),"\n","Otherwise you will need to setup ",(0,n.jsx)(t.a,{href:"https://docs.expo.dev/develop/development-builds/introduction/",children:"Expo Dev Client"}),"."]}),"\n",(0,n.jsx)(t.p,{children:"Now you ready to add tentap to your app!"}),"\n",(0,n.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-tsx",children:"export const Basic = () => {\n  const editor = useEditorBridge({\n    autofocus: true,\n    avoidIosKeyboard: true,\n    initialContent: 'Start editing!',\n  });\n\n  return (\n    <SafeAreaView style={{ flex: 1 }}>\n      <RichText editor={editor} />\n      <KeyboardAvoidingView\n        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}\n        style={{\n          position: 'absolute',\n          width: '100%',\n          bottom: 0,\n        }}\n      >\n        <Toolbar editor={editor} />\n      </KeyboardAvoidingView>\n    </SafeAreaView>\n  );\n};\n"})}),"\n",(0,n.jsx)(t.h2,{id:"contributing",children:"Contributing"}),"\n",(0,n.jsxs)(t.p,{children:["See the ",(0,n.jsx)(t.a,{href:"https://github.com/10play/10tap-editor/blob/main/CONTRIBUTING.md",children:"contributing guide"})," to learn how to contribute to the repository and the development workflow."]}),"\n",(0,n.jsx)(t.h2,{id:"license",children:"License"}),"\n",(0,n.jsx)(t.p,{children:"MIT"}),"\n",(0,n.jsx)(t.hr,{}),"\n",(0,n.jsxs)(t.p,{children:["Made with ",(0,n.jsx)(t.a,{href:"https://github.com/callstack/react-native-builder-bob",children:"create-react-native-library"})]})]})}function p(e={}){const{wrapper:t}={...(0,o.M)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(c,{...e})}):c(e)}},2172:(e,t,i)=>{i.d(t,{I:()=>s,M:()=>r});var n=i(1504);const o={},a=n.createContext(o);function r(e){const t=n.useContext(a);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),n.createElement(a.Provider,{value:t},e.children)}}}]);