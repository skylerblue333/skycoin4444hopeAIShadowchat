import{a,j as e,g as v,az as z,bE as T,ar as F,bV as $,D as U,aP as G,au as O,bU as W,al as H,bF as k,aY as B,be as K,e as L,cM as J,V as q,bX as X,G as Y,u as Q,bn as Z,m as ee,cN as te,bK as se}from"./vendor-react-BvaP5HWK.js";import{u as ae,B as i,T as oe}from"./index-CV91ccQl.js";import{C as ie,d as ne}from"./card-LGPFUvXP.js";import"./vendor-trpc-DrjY0t2M.js";import"./vendor-query-CyzVs99K.js";import"./vendor-misc-nkqgr0d7.js";import"./vendor-date-Bsm0peQd.js";import"./vendor-charts-CckOCQ17.js";import"./vendor-radix-BQCqNqg0.js";const y=[{id:"chat",name:"Chat",icon:e.jsxDEV(L,{"data-loc":"client/src/pages/HopeAIMeta.tsx:39",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:39,columnNumber:37},void 0),description:"Conversational AI"},{id:"code",name:"Code",icon:e.jsxDEV(J,{"data-loc":"client/src/pages/HopeAIMeta.tsx:40",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:40,columnNumber:37},void 0),description:"Code generation & debugging"},{id:"image",name:"Image",icon:e.jsxDEV(k,{"data-loc":"client/src/pages/HopeAIMeta.tsx:41",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:41,columnNumber:39},void 0),description:"Image generation & analysis"},{id:"video",name:"Video",icon:e.jsxDEV(q,{"data-loc":"client/src/pages/HopeAIMeta.tsx:42",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:42,columnNumber:39},void 0),description:"Video understanding"},{id:"document",name:"Document",icon:e.jsxDEV(X,{"data-loc":"client/src/pages/HopeAIMeta.tsx:43",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:43,columnNumber:45},void 0),description:"Document analysis"},{id:"web",name:"Web Search",icon:e.jsxDEV(Y,{"data-loc":"client/src/pages/HopeAIMeta.tsx:44",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:44,columnNumber:42},void 0),description:"Real-time web search"},{id:"reasoning",name:"Reasoning",icon:e.jsxDEV(Q,{"data-loc":"client/src/pages/HopeAIMeta.tsx:45",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:45,columnNumber:47},void 0),description:"Advanced reasoning"},{id:"execution",name:"Execution",icon:e.jsxDEV(Z,{"data-loc":"client/src/pages/HopeAIMeta.tsx:46",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:46,columnNumber:47},void 0),description:"Code execution"},{id:"data",name:"Data Analysis",icon:e.jsxDEV(ee,{"data-loc":"client/src/pages/HopeAIMeta.tsx:47",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:47,columnNumber:46},void 0),description:"Data analysis & visualization"},{id:"creative",name:"Creative",icon:e.jsxDEV(te,{"data-loc":"client/src/pages/HopeAIMeta.tsx:48",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:48,columnNumber:45},void 0),description:"Creative writing"},{id:"voice",name:"Voice",icon:e.jsxDEV(H,{"data-loc":"client/src/pages/HopeAIMeta.tsx:49",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:49,columnNumber:39},void 0),description:"Voice interaction"},{id:"vision",name:"Vision",icon:e.jsxDEV(se,{"data-loc":"client/src/pages/HopeAIMeta.tsx:50",className:"w-5 h-5"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:50,columnNumber:41},void 0),description:"Visual understanding"}];function Ae(){ae();const[l,r]=a.useState([]),[s,u]=a.useState(""),[n,D]=a.useState("chat"),[x,h]=a.useState(!1),[E,N]=a.useState(!0),[m,V]=a.useState(!0),[j,g]=a.useState([]),[d,p]=a.useState(null),[w,_]=a.useState(!1),[ce,le]=a.useState(.7),[re,ue]=a.useState(2048),f=a.useRef(null),C=()=>{f.current?.scrollIntoView({behavior:"smooth"})};a.useEffect(()=>{C()},[l]);const A=async()=>{if(!s.trim())return;const t={id:`msg-${Date.now()}`,role:"user",content:s,timestamp:Date.now(),capability:n};r(o=>[...o,t]),u(""),h(!0);try{await new Promise(c=>setTimeout(c,1200));let o="";const b=Math.random()*2e3+500,M={code:`\`\`\`javascript
// Generated code for: ${s}
function solution() {
  // Implementation optimized for performance
  return result;
}

// Usage:
const result = solution();
\`\`\`

**Key Features:**
- Efficient algorithm (O(n) complexity)
- Production-ready code
- Comprehensive error handling
- Well-documented`,image:`**Image Generation Ready**

I can generate images for: ${s}

**Available Options:**
- Style: Photorealistic, Artistic, Cartoon, 3D
- Resolution: 1024x1024, 1536x1536, 2048x2048
- Format: PNG, JPEG, WebP

Ready to generate when you confirm!`,video:`**Video Analysis**

Analyzing video content for: ${s}

**Capabilities:**
- Scene detection and segmentation
- Object recognition and tracking
- Speech-to-text transcription
- Emotion and sentiment analysis
- Action recognition
- Key frame extraction

Upload a video to analyze or describe what you'd like me to analyze.`,document:`**Document Analysis**

Processing document for: ${s}

**Supported Formats:**
- PDF, DOCX, TXT, CSV
- Images (OCR)
- Spreadsheets
- Code files

**Analysis Features:**
- Content extraction
- Summarization
- Key insights
- Entity recognition
- Sentiment analysis

Upload a document to get started!`,web:`**Web Search Results for:** "${s}"

**Top Results:**
1. **Result 1** - Highly relevant information
2. **Result 2** - Additional context
3. **Result 3** - Related resources

**Key Findings:**
- Latest information from reliable sources
- Real-time data and trends
- Comprehensive overview

Would you like me to dive deeper into any result?`,reasoning:`**Step-by-Step Analysis**

**Problem:** ${s}

**Step 1: Understanding**
Breaking down the core components...

**Step 2: Analysis**
Examining each element in detail...

**Step 3: Solution**
Synthesizing insights...

**Step 4: Verification**
Validating the approach...

**Confidence Level:** 94%
**Reasoning Depth:** Advanced`,execution:`**Code Execution Environment**

Ready to execute code for: ${s}

**Available Runtimes:**
- Node.js (JavaScript/TypeScript)
- Python 3.11
- Bash/Shell

**Sandbox Features:**
- Isolated execution
- Real-time output
- Error capture
- Performance metrics

Paste your code and I'll execute it!`,data:`**Data Analysis Dashboard**

Analyzing data for: ${s}

**Available Analyses:**
- Statistical summary
- Trend analysis
- Correlation analysis
- Anomaly detection
- Forecasting
- Visualization

**Output Formats:**
- Charts and graphs
- CSV export
- JSON data
- Statistical report

Upload your dataset to begin!`,creative:`**Creative Writing Assistant**

Generating creative content for: ${s}

**Styles Available:**
- Fiction & storytelling
- Poetry & verse
- Marketing copy
- Technical writing
- Dialogue & scripts
- World-building

**Features:**
- Multiple variations
- Tone customization
- Length control
- Revision suggestions

Ready to create something amazing!`,voice:`**Voice Interaction Ready**

Processing voice request: ${s}

**Voice Capabilities:**
- Speech recognition
- Natural language understanding
- Voice synthesis
- Accent adaptation
- Emotion detection

**Supported Languages:**
- English (US, UK, AU)
- Spanish, French, German
- Mandarin, Japanese
- 50+ more languages

Click the microphone to start speaking!`,vision:`**Visual Understanding**

Analyzing visual content for: ${s}

**Vision Capabilities:**
- Object detection
- Scene understanding
- Text recognition (OCR)
- Face recognition
- Emotion detection
- Image classification

**Supported Formats:**
- JPEG, PNG, WebP
- GIF, TIFF
- Video frames

Upload an image to analyze!`};o=M[n]||M.chat;const R={id:`msg-${Date.now()+1}`,role:"assistant",content:o,timestamp:Date.now(),capability:n,metadata:{tokensUsed:Math.floor(Math.random()*1e3)+100,thinkingTime:Math.floor(b),confidence:Math.random()*.3+.85}};if(r(c=>[...c,R]),!d){const c={id:`conv-${Date.now()}`,title:s.substring(0,50),capability:n,lastMessage:o.substring(0,100),timestamp:Date.now(),messageCount:2};g(P=>[c,...P]),p(c.id)}}catch{K.error("Failed to process request")}finally{h(!1)}},I=()=>{r([]),p(null),u("")},S=t=>{g(o=>o.filter(b=>b.id!==t)),d===t&&I()};return E?e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:353",className:"min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex",children:[m&&e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:356",className:"w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:358",className:"p-4 border-b border-slate-800",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:359",className:"flex items-center gap-2 mb-4",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:360",className:"w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center",children:e.jsxDEV(v,{"data-loc":"client/src/pages/HopeAIMeta.tsx:361",className:"w-5 h-5 text-white"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:361,columnNumber:17},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:360,columnNumber:15},this),e.jsxDEV("h1",{"data-loc":"client/src/pages/HopeAIMeta.tsx:363",className:"text-lg font-bold text-white",children:"Hope AI"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:363,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:359,columnNumber:13},this),e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:365",onClick:I,className:"w-full bg-blue-600 hover:bg-blue-700 text-white",children:[e.jsxDEV(z,{"data-loc":"client/src/pages/HopeAIMeta.tsx:369",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:369,columnNumber:15},this),"New Chat"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:365,columnNumber:13},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:358,columnNumber:11},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:375",className:"flex-1 overflow-y-auto p-3 space-y-2",children:j.map(t=>e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:377",onClick:()=>p(t.id),className:`p-3 rounded-lg cursor-pointer transition-all group ${d===t.id?"bg-blue-600/30 border border-blue-500/50":"hover:bg-slate-800/50 border border-transparent"}`,children:[e.jsxDEV("p",{"data-loc":"client/src/pages/HopeAIMeta.tsx:386",className:"text-sm text-white truncate",children:t.title},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:386,columnNumber:17},this),e.jsxDEV("p",{"data-loc":"client/src/pages/HopeAIMeta.tsx:387",className:"text-xs text-slate-400 mt-1",children:t.capability},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:387,columnNumber:17},this),e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:388",size:"sm",variant:"ghost",onClick:o=>{o.stopPropagation(),S(t.id)},className:"opacity-0 group-hover:opacity-100 mt-2 h-6 w-6 p-0",children:e.jsxDEV(T,{"data-loc":"client/src/pages/HopeAIMeta.tsx:397",className:"w-3 h-3"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:397,columnNumber:19},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:388,columnNumber:17},this)]},t.id,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:377,columnNumber:15},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:375,columnNumber:11},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:404",className:"p-3 border-t border-slate-800",children:e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:405",variant:"ghost",size:"sm",onClick:()=>_(!w),className:"w-full justify-start text-slate-300",children:[e.jsxDEV(F,{"data-loc":"client/src/pages/HopeAIMeta.tsx:411",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:411,columnNumber:15},this),"Settings"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:405,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:404,columnNumber:11},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:356,columnNumber:9},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:419",className:"flex-1 flex flex-col",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:421",className:"bg-slate-900/50 border-b border-slate-800 p-4 flex items-center justify-between",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:422",className:"flex items-center gap-3",children:[e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:423",variant:"ghost",size:"sm",onClick:()=>V(!m),className:"text-slate-400",children:m?e.jsxDEV($,{"data-loc":"client/src/pages/HopeAIMeta.tsx:429",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:429,columnNumber:30},this):e.jsxDEV(U,{"data-loc":"client/src/pages/HopeAIMeta.tsx:429",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:429,columnNumber:113},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:423,columnNumber:13},this),e.jsxDEV("h2",{"data-loc":"client/src/pages/HopeAIMeta.tsx:431",className:"text-lg font-semibold text-white",children:y.find(t=>t.id===n)?.name||"Hope AI"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:431,columnNumber:13},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:422,columnNumber:11},this),e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:435",variant:"ghost",size:"sm",onClick:()=>N(!1),className:"text-slate-400",children:e.jsxDEV(G,{"data-loc":"client/src/pages/HopeAIMeta.tsx:441",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:441,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:435,columnNumber:11},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:421,columnNumber:9},this),l.length===0&&e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:447",className:"flex-1 overflow-y-auto p-6",children:e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:448",className:"max-w-6xl mx-auto",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:449",className:"mb-8",children:[e.jsxDEV("h1",{"data-loc":"client/src/pages/HopeAIMeta.tsx:450",className:"text-4xl font-bold text-white mb-2",children:"Hope AI"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:450,columnNumber:17},this),e.jsxDEV("p",{"data-loc":"client/src/pages/HopeAIMeta.tsx:451",className:"text-slate-400",children:"Powered by advanced AI - Better than Meta AI"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:451,columnNumber:17},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:449,columnNumber:15},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:454",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:y.map(t=>e.jsxDEV(ie,{"data-loc":"client/src/pages/HopeAIMeta.tsx:456",onClick:()=>D(t.id),className:`cursor-pointer transition-all border-2 ${n===t.id?"border-blue-500 bg-blue-500/10":"border-slate-700 hover:border-blue-500/50 bg-slate-800/30"}`,children:e.jsxDEV(ne,{"data-loc":"client/src/pages/HopeAIMeta.tsx:465",className:"p-4",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:466",className:"flex items-center gap-3 mb-2",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:467",className:"text-blue-400",children:t.icon},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:467,columnNumber:25},this),e.jsxDEV("h3",{"data-loc":"client/src/pages/HopeAIMeta.tsx:468",className:"font-semibold text-white",children:t.name},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:468,columnNumber:25},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:466,columnNumber:23},this),e.jsxDEV("p",{"data-loc":"client/src/pages/HopeAIMeta.tsx:470",className:"text-sm text-slate-400",children:t.description},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:470,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:465,columnNumber:21},this)},t.id,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:456,columnNumber:19},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:454,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:448,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:447,columnNumber:11},this),l.length>0&&e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:481",className:"flex-1 overflow-y-auto p-6",children:e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:482",className:"max-w-4xl mx-auto space-y-4",children:[l.map(t=>e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:484",className:`flex ${t.role==="user"?"justify-end":"justify-start"}`,children:e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:485",className:`max-w-2xl px-4 py-3 rounded-lg ${t.role==="user"?"bg-blue-600 text-white rounded-br-none":"bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"}`,children:[e.jsxDEV("p",{"data-loc":"client/src/pages/HopeAIMeta.tsx:492",className:"text-sm whitespace-pre-wrap",children:t.content},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:492,columnNumber:21},this),t.metadata&&e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:494",className:"text-xs text-slate-400 mt-2 flex gap-2",children:[e.jsxDEV("span",{"data-loc":"client/src/pages/HopeAIMeta.tsx:495",children:["⏱️ ",t.metadata.thinkingTime,"ms"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:495,columnNumber:25},this),e.jsxDEV("span",{"data-loc":"client/src/pages/HopeAIMeta.tsx:496",children:["📊 ",t.metadata.tokensUsed," tokens"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:496,columnNumber:25},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:494,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:485,columnNumber:19},this)},t.id,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:484,columnNumber:17},this)),x&&e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:503",className:"flex justify-start",children:e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:504",className:"bg-slate-800 text-slate-300 px-4 py-3 rounded-lg border border-slate-700",children:e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:505",className:"flex gap-2",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:506",className:"w-2 h-2 bg-blue-400 rounded-full animate-bounce"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:506,columnNumber:23},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:507",className:"w-2 h-2 bg-blue-400 rounded-full animate-bounce",style:{animationDelay:"0.1s"}},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:507,columnNumber:23},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:508",className:"w-2 h-2 bg-blue-400 rounded-full animate-bounce",style:{animationDelay:"0.2s"}},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:508,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:505,columnNumber:21},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:504,columnNumber:19},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:503,columnNumber:17},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:513",ref:f},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:513,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:482,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:481,columnNumber:11},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:519",className:"bg-slate-900/50 border-t border-slate-800 p-4",children:e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:520",className:"max-w-4xl mx-auto space-y-3",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:521",className:"flex gap-2",children:[e.jsxDEV(oe,{"data-loc":"client/src/pages/HopeAIMeta.tsx:522",value:s,onChange:t=>u(t.target.value),onKeyDown:t=>{t.key==="Enter"&&t.ctrlKey&&A()},placeholder:"Ask Hope AI anything...",className:"flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500 resize-none",rows:3},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:522,columnNumber:15},this),e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:534",onClick:A,disabled:x||!s.trim(),className:"bg-blue-600 hover:bg-blue-700 text-white h-full",children:e.jsxDEV(O,{"data-loc":"client/src/pages/HopeAIMeta.tsx:539",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:539,columnNumber:17},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:534,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:521,columnNumber:13},this),e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:543",className:"flex gap-2 flex-wrap",children:[{icon:e.jsxDEV(W,{"data-loc":"client/src/pages/HopeAIMeta.tsx:545",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:545,columnNumber:25},this),label:"Upload"},{icon:e.jsxDEV(H,{"data-loc":"client/src/pages/HopeAIMeta.tsx:546",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:546,columnNumber:25},this),label:"Voice"},{icon:e.jsxDEV(k,{"data-loc":"client/src/pages/HopeAIMeta.tsx:547",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:547,columnNumber:25},this),label:"Image"},{icon:e.jsxDEV(B,{"data-loc":"client/src/pages/HopeAIMeta.tsx:548",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:548,columnNumber:25},this),label:"Code"}].map((t,o)=>e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:550",variant:"outline",size:"sm",className:"border-slate-700 text-slate-300 hover:bg-slate-800",children:[t.icon,t.label]},o,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:550,columnNumber:17},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:543,columnNumber:13},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:520,columnNumber:11},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:519,columnNumber:9},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:419,columnNumber:7},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:353,columnNumber:5},this):e.jsxDEV("div",{"data-loc":"client/src/pages/HopeAIMeta.tsx:341",className:"fixed bottom-4 right-4 z-50",children:e.jsxDEV(i,{"data-loc":"client/src/pages/HopeAIMeta.tsx:342",onClick:()=>N(!0),className:"rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg",children:e.jsxDEV(v,{"data-loc":"client/src/pages/HopeAIMeta.tsx:346",className:"w-6 h-6"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:346,columnNumber:11},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:342,columnNumber:9},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/HopeAIMeta.tsx",lineNumber:341,columnNumber:7},this)}export{Ae as default};
