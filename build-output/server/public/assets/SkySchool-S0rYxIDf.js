import{a as u,j as e,bx as T,O as M,aa as _,bR as V,Z as P,aC as I,bH as H,bn as r,ak as W,E as z,be as p}from"./vendor-react-BvaP5HWK.js";import{u as U,B as l,a as N}from"./index-CV91ccQl.js";import{C as a,a as f,b as v,d as n}from"./card-LGPFUvXP.js";import{T as O,a as q,b as w,c as E}from"./tabs-CSpjNKm7.js";import{I as K}from"./input-Cxb3NKjj.js";import"./vendor-trpc-DrjY0t2M.js";import"./vendor-query-CyzVs99K.js";import"./vendor-misc-nkqgr0d7.js";import"./vendor-date-Bsm0peQd.js";import"./vendor-charts-CckOCQ17.js";import"./vendor-radix-BQCqNqg0.js";const y=[{id:"blockchain-101",track:"web3",category:"Blockchain",level:"Beginner",icon:"⛓️",title:"Blockchain Fundamentals",description:"Master distributed ledgers, consensus mechanisms, and cryptography",lessons:12,duration:"4h 30m",xpReward:500,skyReward:50,students:28400,rating:4.9,color:"oklch(0.72 0.20 200)",topics:[{title:"What is Blockchain?",videoId:"SSo_EIwHcMw",content:`Blockchain is a distributed ledger technology that maintains a continuously growing list of records called blocks. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data.

Key Concepts:
• Decentralization: No single point of failure
• Immutability: Once recorded, data cannot be altered
• Transparency: All participants can view transactions
• Security: Cryptographic protection of data

Bitcoin, the first blockchain, was created in 2008 by Satoshi Nakamoto. It introduced the concept of a peer-to-peer electronic cash system without requiring a trusted third party.

Learning Objectives:
✓ Understand blockchain architecture
✓ Learn about distributed systems
✓ Grasp the importance of cryptography
✓ Know the difference between public and private blockchains`},{title:"Distributed Ledgers",videoId:"qXZwmGkpixE",content:`A distributed ledger is a database that is consensually shared, replicated, and synchronized across multiple sites, institutions, or geographies. Unlike traditional centralized databases, distributed ledgers have no single point of control.

Characteristics:
• Replicated: Copies exist on multiple nodes
• Synchronized: All copies are kept in sync
• Shared: Participants have access to the same data
• Consensus-based: Changes require agreement

Advantages:
✓ Increased resilience and fault tolerance
✓ Reduced latency in data updates
✓ Enhanced security through redundancy
✓ Greater transparency and auditability

Use Cases:
• Supply chain tracking
• Cross-border payments
• Smart contracts
• Digital identity management`},{title:"Consensus Mechanisms",videoId:"3EUAcxhuoU4",content:`Consensus mechanisms are protocols that enable distributed networks to agree on a single version of the truth. They ensure that all nodes in the network maintain the same state.

Proof of Work (PoW):
• Miners compete to solve complex mathematical puzzles
• First to solve gets to add the next block
• Energy-intensive but highly secure
• Used by Bitcoin

Proof of Stake (PoS):
• Validators are chosen based on their stake
• More energy-efficient than PoW
• Used by Ethereum 2.0
• Reduces barriers to entry

Other Mechanisms:
• Delegated Proof of Stake (DPoS)
• Proof of Authority (PoA)
• Proof of History (PoH)
• Proof of Elapsed Time (PoET)

Comparison:
PoW is more decentralized but energy-intensive.
PoS is more efficient but requires significant capital.`},{title:"Hash Functions",videoId:"DMtFhACPnTY",content:`Hash functions are mathematical algorithms that convert input data of any size into a fixed-size string of bytes. The output is called a hash or digest.

Properties of Cryptographic Hash Functions:
• Deterministic: Same input always produces same output
• Quick: Fast to compute hash value
• Avalanche Effect: Small change in input drastically changes output
• One-way: Infeasible to reverse the hash
• Collision-resistant: Hard to find two inputs with same hash

Common Hash Functions:
• SHA-256: Used in Bitcoin, produces 256-bit hash
• SHA-3: Latest standard, more secure
• BLAKE2: Fast and secure alternative
• Keccak: Used in Ethereum

Applications in Blockchain:
• Creating block identifiers
• Verifying data integrity
• Merkle trees for efficient verification
• Proof of Work in mining`},{title:"Merkle Trees",videoId:"V9l-Yd9LFEA",content:`Merkle trees are binary trees of hashes where each leaf node contains the hash of data, and each non-leaf node contains the hash of its children.

Structure:
• Leaf nodes: Hash of transactions
• Parent nodes: Hash of concatenated child hashes
• Root: Single hash representing all data

Advantages:
✓ Efficient verification of large datasets
✓ Detect changes in any part of data
✓ Reduce storage requirements
✓ Enable light clients

How It Works:
1. Hash each transaction individually
2. Combine pairs of hashes and hash again
3. Repeat until single root hash remains
4. Root hash represents entire block

Applications:
• Bitcoin: Merkle root in block header
• Ethereum: Modified Merkle Patricia trees
• IPFS: Merkle DAGs
• Git: Merkle trees for version control

Verification:
To verify a specific transaction, only need O(log n) hashes instead of all n transactions.`},{title:"Smart Contracts Intro",videoId:"ZE2HxTmxfrI",content:`Smart contracts are self-executing contracts with terms written in code. They automatically execute when conditions are met.

Characteristics:
• Immutable: Cannot be changed once deployed
• Transparent: Code is visible to all
• Deterministic: Same input always produces same output
• Autonomous: Execute without intermediaries

How They Work:
1. Code is deployed to blockchain
2. Contract state is stored on-chain
3. Functions are called via transactions
4. Results are recorded on blockchain

Benefits:
✓ Eliminate intermediaries
✓ Reduce costs and delays
✓ Increase transparency
✓ Enable complex automation

Use Cases:
• Decentralized Finance (DeFi)
• Insurance claims
• Supply chain management
• Digital assets and NFTs

Platforms:
• Ethereum: Most popular, uses Solidity
• Cardano: Uses Plutus
• Polkadot: Uses Ink!
• Solana: Uses Rust`},{title:"Public vs Private Chains",videoId:"yubzJw0uiE4",content:`Blockchain networks can be classified as public or private based on access and participation.

Public Blockchains:
• Open to anyone
• Fully decentralized
• Transparent transactions
• Immutable records
• Examples: Bitcoin, Ethereum
• Slower but more secure
• No single point of control

Private Blockchains:
• Restricted access
• Controlled by organizations
• Faster transactions
• Privacy protection
• Examples: Hyperledger, Corda
• Centralized governance
• Better for enterprise

Comparison:
Public: Decentralization, Security, Transparency
Private: Speed, Privacy, Control

Hybrid Approaches:
• Consortium chains: Multiple organizations
• Permissioned public chains: Open but controlled
• Sidechains: Connected to main chain

Choosing the Right Type:
Consider: Decentralization needs, Privacy requirements, Performance needs, Regulatory compliance`},{title:"Layer 1 vs Layer 2",videoId:"uJWmhjxtuK8",content:`Blockchain scaling solutions are divided into Layer 1 (on-chain) and Layer 2 (off-chain) solutions.

Layer 1 Solutions (On-Chain):
• Increase base layer capacity
• Larger block sizes
• Faster block times
• Sharding: Divide network into smaller parts
• Examples: Bitcoin Lightning Network, Ethereum 2.0
• Trade-off: Decentralization vs scalability

Layer 2 Solutions (Off-Chain):
• Process transactions off main chain
• Settle periodically on Layer 1
• Maintain security of Layer 1
• Much faster and cheaper
• Examples: Lightning Network, Polygon, Arbitrum
• Rollups: Batch transactions and compress data

Rollup Types:
• Optimistic Rollups: Assume transactions valid, prove fraud
• Zero-Knowledge Rollups: Prove validity with cryptography

Comparison:
Layer 1: Slower but more secure and decentralized
Layer 2: Faster and cheaper but depends on Layer 1

Current Solutions:
• Bitcoin: Lightning Network (Layer 2)
• Ethereum: Polygon, Arbitrum, Optimism (Layer 2)
• Ethereum 2.0: Sharding (Layer 1)`},{title:"Blockchain Use Cases",videoId:"aQDpFJRkp-s",content:`Beyond cryptocurrency, blockchain has numerous real-world applications.

Supply Chain:
• Track products from manufacture to consumer
• Verify authenticity
• Reduce counterfeiting
• Improve transparency
• Companies: Walmart, Maersk

Healthcare:
• Secure medical records
• Drug traceability
• Clinical trial data
• Insurance claims
• Privacy-preserving

Real Estate:
• Property ownership records
• Smart contracts for transactions
• Reduce fraud
• Faster settlements
• Lower costs

Digital Identity:
• Self-sovereign identity
• Verifiable credentials
• Privacy protection
• Cross-border recognition
• Financial inclusion

Voting:
• Transparent elections
• Prevent fraud
• Accessibility
• Instant results
• Voter privacy

Intellectual Property:
• Copyright protection
• Royalty distribution
• NFTs for digital assets
• Proof of ownership
• Automated licensing`},{title:"Security Fundamentals",videoId:"Ks1M5SBoFCI",content:`Blockchain security relies on cryptography and distributed consensus.

Cryptographic Security:
• Public-key cryptography
• Digital signatures
• Hash functions
• Merkle trees
• Protects data integrity and authenticity

Consensus Security:
• 51% attack: Control majority of network
• Double-spending prevention
• Transaction finality
• Network resilience

Common Attacks:
• Sybil Attack: Create fake identities
• Eclipse Attack: Isolate nodes
• Selfish Mining: Withhold blocks
• 51% Attack: Control network majority

Protection Measures:
✓ Cryptographic hashing
✓ Digital signatures
✓ Distributed consensus
✓ Economic incentives
✓ Regular audits
✓ Bug bounty programs

Best Practices:
• Use reputable wallets
• Enable 2FA
• Backup private keys
• Verify smart contracts
• Stay updated on security news`},{title:"Wallets & Keys",videoId:"d8IBpfs9bf0",content:`Cryptocurrency wallets store and manage your private and public keys.

Key Concepts:
• Private Key: Secret key for signing transactions
• Public Key: Derived from private key
• Address: Hash of public key
• Seed Phrase: 12-24 words to recover wallet

Types of Wallets:
• Hot Wallets: Connected to internet (MetaMask, Trust Wallet)
• Cold Wallets: Offline storage (Ledger, Trezor)
• Hardware Wallets: Physical devices
• Paper Wallets: Printed keys
• Multi-sig Wallets: Multiple signatures required

Security Best Practices:
✓ Never share private keys
✓ Use hardware wallets for large amounts
✓ Backup seed phrases securely
✓ Use strong passwords
✓ Enable 2FA
✓ Verify addresses carefully

Common Mistakes:
• Storing keys in plain text
• Using weak passwords
• Sharing seed phrases
• Clicking phishing links
• Using public WiFi for transactions

Recovery:
• Seed phrase allows wallet recovery
• Keep backups in multiple locations
• Use password managers
• Test recovery process regularly`},{title:"Final Assessment",videoId:"SSo_EIwHcMw",content:`Congratulations on completing Blockchain Fundamentals!

Quiz Topics:
1. What is blockchain and how does it work?
2. Explain consensus mechanisms
3. Describe hash functions and their properties
4. How do Merkle trees work?
5. What are smart contracts?
6. Differences between public and private blockchains
7. Layer 1 vs Layer 2 solutions
8. Real-world blockchain applications
9. Security best practices
10. Wallet management

Key Takeaways:
✓ Blockchain is a distributed ledger technology
✓ Consensus mechanisms ensure network agreement
✓ Cryptography protects data integrity
✓ Smart contracts enable automation
✓ Multiple scaling solutions exist
✓ Security is paramount

Next Steps:
• Explore DeFi protocols
• Learn Solidity programming
• Experiment with testnet
• Join blockchain communities
• Stay updated on developments

Certificate:
You have earned your Blockchain Fundamentals certificate!
Share your achievement: #BlockchainFundamentals #SKY4444`}]},{id:"python-dev",track:"coding",category:"Python",level:"Beginner",icon:"🐍",title:"Python for Builders",description:"From zero to production - scripts, APIs, automation, data pipelines",lessons:6,duration:"3h 00m",xpReward:600,skyReward:60,students:45200,rating:4.9,color:"oklch(0.72 0.20 250)",topics:[{title:"Python Basics",videoId:"kqtZohvNjqU",content:`Python is a high-level, interpreted programming language known for its simplicity and readability.

Getting Started:
• Install Python from python.org
• Use interactive shell (REPL)
• Write scripts in .py files
• Run with: python script.py

Basic Syntax:
print("Hello, World!")  # Output text
x = 10  # Variable assignment
name = "Alice"  # String
is_active = True  # Boolean

Data Types:
• int: Integers (1, 2, 3)
• float: Decimals (1.5, 2.7)
• str: Text ("hello")
• bool: True/False
• None: No value

Operations:
• Arithmetic: +, -, *, /, //, %, **
• Comparison: ==, !=, <, >, <=, >=
• Logical: and, or, not

Control Flow:
if x > 5:
    print("x is greater than 5")
elif x == 5:
    print("x equals 5")
else:
    print("x is less than 5")

Loops:
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

while x > 0:
    print(x)
    x -= 1`},{title:"Functions & Modules",videoId:"9Os0o3wzS_I",content:`Functions are reusable blocks of code that perform specific tasks.

Defining Functions:
def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")
print(result)  # Hello, Alice!

Parameters & Arguments:
def add(a, b):
    return a + b

add(3, 5)  # Positional arguments
add(a=3, b=5)  # Keyword arguments

Default Parameters:
def greet(name="World"):
    return f"Hello, {name}!"

greet()  # Hello, World!
greet("Alice")  # Hello, Alice!

Variable Arguments:
def sum_all(*args):
    return sum(args)

sum_all(1, 2, 3, 4)  # 10

Keyword Arguments:
def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=30)

Modules:
import math
print(math.pi)  # 3.14159

from datetime import datetime
now = datetime.now()

Creating Modules:
# mymodule.py
def greet(name):
    return f"Hello, {name}!"

# main.py
from mymodule import greet
print(greet("Alice"))`},{title:"Data Structures",videoId:"W8KRzm-HUcc",content:`Python provides powerful built-in data structures for organizing data.

Lists:
fruits = ["apple", "banana", "cherry"]
fruits.append("date")
fruits[0]  # "apple"
fruits[-1]  # "date"

Tuples (Immutable):
coordinates = (10, 20)
x, y = coordinates  # Unpacking
coordinates[0]  # 10

Dictionaries:
person = {
    "name": "Alice",
    "age": 30,
    "city": "NYC"
}
person["name"]  # "Alice"
person["age"] = 31

Sets (Unique values):
colors = {"red", "green", "blue"}
colors.add("yellow")
colors.remove("red")

List Comprehension:
squares = [x**2 for x in range(5)]
# [0, 1, 4, 9, 16]

Dictionary Comprehension:
squares_dict = {x: x**2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

Common Methods:
list.append(), list.extend(), list.remove()
dict.keys(), dict.values(), dict.items()
set.add(), set.remove(), set.union()`},{title:"File I/O & Error Handling",videoId:"Ql8aKGUBV5c",content:`Reading and writing files, handling errors gracefully.

Reading Files:
with open("file.txt", "r") as f:
    content = f.read()  # Read entire file
    
with open("file.txt", "r") as f:
    lines = f.readlines()  # Read as list

Writing Files:
with open("file.txt", "w") as f:
    f.write("Hello, World!")

Appending to Files:
with open("file.txt", "a") as f:
    f.write("\\nNew line")

Error Handling:
try:
    x = 1 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")
except Exception as e:
    print(f"Error: {e}")
finally:
    print("Cleanup code")

Custom Exceptions:
class CustomError(Exception):
    pass

raise CustomError("Something went wrong")

File Operations:
import os
os.path.exists("file.txt")
os.remove("file.txt")
os.listdir(".")

JSON:
import json
data = {"name": "Alice", "age": 30}
json_str = json.dumps(data)
parsed = json.loads(json_str)`},{title:"APIs with FastAPI",videoId:"7t2alSnE2-I",content:`Build high-performance REST APIs with FastAPI.

Installation:
pip install fastapi uvicorn

Basic API:
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Run: uvicorn main:app --reload

Path Parameters:
@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id}

Query Parameters:
@app.get("/search")
def search(q: str, skip: int = 0, limit: int = 10):
    return {"query": q, "skip": skip, "limit": limit}

Request Body:
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    price: float
    description: str = None

@app.post("/items/")
def create_item(item: Item):
    return item

Response Models:
@app.get("/items/{item_id}", response_model=Item)
def get_item(item_id: int):
    return {"name": "Item", "price": 9.99}

Status Codes:
@app.post("/items/", status_code=201)
def create_item(item: Item):
    return item

Validation:
from pydantic import Field

class Item(BaseModel):
    name: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)`},{title:"Final Project",videoId:"kqtZohvNjqU",content:`Build a complete Python application combining all concepts.

Project: Task Management API

Requirements:
✓ Create, read, update, delete tasks
✓ Store tasks in JSON file
✓ Validate input data
✓ Handle errors gracefully
✓ Provide REST API endpoints

Implementation:
1. Define Task model with Pydantic
2. Create CRUD functions
3. Build FastAPI endpoints
4. Add error handling
5. Test with curl or Postman

Endpoints:
GET /tasks - List all tasks
POST /tasks - Create new task
GET /tasks/{id} - Get specific task
PUT /tasks/{id} - Update task
DELETE /tasks/{id} - Delete task

Testing:
curl http://localhost:8000/tasks
curl -X POST http://localhost:8000/tasks -H "Content-Type: application/json" -d '{"title":"Learn Python"}'

Deployment:
pip freeze > requirements.txt
Deploy to Heroku, Railway, or Render

Certificate:
You have completed Python for Builders!
Showcase your API project on GitHub.`}]},{id:"js-mastery",track:"coding",category:"JavaScript",level:"Beginner",icon:"⚡",title:"JavaScript & React Mastery",description:"Modern JS/TS from fundamentals to full-stack React apps",lessons:6,duration:"3h 30m",xpReward:700,skyReward:70,students:52100,rating:4.9,color:"oklch(0.80 0.20 70)",topics:[{title:"JavaScript Fundamentals",videoId:"jS4aFq5-91M",content:`JavaScript is the programming language of the web.

Getting Started:
• Browser console: F12 or Cmd+Option+I
• Node.js: npm install -g node
• Run: node script.js

Variables:
var x = 10;  // Function-scoped
let y = 20;  // Block-scoped (preferred)
const z = 30;  // Immutable

Data Types:
• Number: 42, 3.14
• String: "hello", 'world'
• Boolean: true, false
• Object: {name: "Alice"}
• Array: [1, 2, 3]
• null, undefined

Operators:
// Arithmetic
1 + 2, 5 - 3, 4 * 2, 8 / 2

// Comparison
5 == "5", 5 === 5, 5 !== 3

// Logical
true && false, true || false, !true

Functions:
function add(a, b) {
    return a + b;
}

const multiply = (a, b) => a * b;

Arrow Functions:
const greet = (name) => {
    return \`Hello, \${name}!\`;
};`},{title:"DOM & Events",videoId:"0ik6X7EL_60",content:`Interact with HTML elements and handle user events.

Selecting Elements:
document.getElementById("myId")
document.querySelector(".myClass")
document.querySelectorAll("p")

Modifying Content:
element.textContent = "New text"
element.innerHTML = "<p>HTML content</p>"
element.setAttribute("class", "active")

Styling:
element.style.color = "red"
element.style.backgroundColor = "blue"
element.classList.add("active")
element.classList.remove("inactive")

Event Listeners:
element.addEventListener("click", function() {
    });

Common Events:
• click: Mouse click
• submit: Form submission
• change: Input value change
• keydown: Key pressed
• mouseover: Mouse over element
• load: Page loaded

Event Object:
element.addEventListener("click", (event) => {
      // Element clicked
    event.preventDefault();  // Stop default behavior
});

Creating Elements:
const newDiv = document.createElement("div")
newDiv.textContent = "Hello"
document.body.appendChild(newDiv)`},{title:"React Basics",videoId:"SqcY0GlEPh4",content:`React is a JavaScript library for building UIs with components.

Installation:
npx create-react-app my-app
cd my-app
npm start

Components:
function Welcome() {
    return <h1>Hello, World!</h1>;
}

JSX:
const element = (
    <div>
        <h1>Title</h1>
        <p>Paragraph</p>
    </div>
);

Props:
function Greeting(props) {
    return <h1>Hello, {props.name}!</h1>;
}

<Greeting name="Alice" />

State:
import { useState } from "react";

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}

Effects:
import { useEffect } from "react";

useEffect(() => {
        return () => }, []);  // Dependency array`},{title:"Advanced React",videoId:"I6qqG1usqKE",content:`Advanced React patterns and best practices.

Context API:
import { createContext, useState } from "react";

const ThemeContext = createContext();

function App() {
    const [theme, setTheme] = useState("light");
    
    return (
        <ThemeContext.Provider value={{theme, setTheme}}>
            <Component />
        </ThemeContext.Provider>
    );
}

Custom Hooks:
function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);
    
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    
    return width;
}

Performance:
• React.memo: Prevent unnecessary re-renders
• useMemo: Memoize expensive computations
• useCallback: Memoize functions

Routing:
import { BrowserRouter, Routes, Route } from "react-router-dom";

<BrowserRouter>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
    </Routes>
</BrowserRouter>

Form Handling:
const [formData, setFormData] = useState({});

const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
};`},{title:"Building with Next.js",videoId:"Sklc_fQBmcs",content:`Next.js is a React framework for production applications.

Getting Started:
npx create-next-app@latest my-app
cd my-app
npm run dev

File-based Routing:
app/page.tsx → /
app/about/page.tsx → /about
app/blog/[id]/page.tsx → /blog/:id

Server Components:
// app/page.tsx
export default function Home() {
    return <h1>Welcome</h1>;
}

API Routes:
// app/api/hello/route.ts
export async function GET() {
    return Response.json({ message: "Hello" });
}

Data Fetching:
async function getData() {
    const res = await fetch("https://api.example.com/data");
    return res.json();
}

export default async function Page() {
    const data = await getData();
    return <div>{data}</div>;
}

Dynamic Routes:
// app/blog/[id]/page.tsx
export default function Post({ params }) {
    return <h1>Post {params.id}</h1>;
}

Deployment:
npm run build
Deploy to Vercel with one click`},{title:"Final Project",videoId:"jS4aFq5-91M",content:`Build a complete full-stack application.

Project: Task Management App

Features:
✓ Create, read, update, delete tasks
✓ Mark tasks as complete
✓ Filter by status
✓ Persistent storage
✓ Beautiful UI

Tech Stack:
• Frontend: React with Tailwind CSS
• Backend: Next.js API routes
• Database: JSON file or SQLite
• Deployment: Vercel

Implementation:
1. Create task component
2. Build task list
3. Add form for new tasks
4. Implement API routes
5. Add styling
6. Deploy to Vercel

Features to Add:
• Due dates
• Priority levels
• Categories
• Search functionality
• Dark mode
• Mobile responsive

Testing:
• Manual testing
• Unit tests with Jest
• E2E tests with Cypress

Certificate:
You have completed JavaScript & React Mastery!
Share your project on GitHub and deploy on Vercel.`}]}],D={Beginner:"bg-green-500/20 text-green-300 border-green-500/30",Intermediate:"bg-yellow-500/20 text-yellow-300 border-yellow-500/30",Advanced:"bg-red-500/20 text-red-300 border-red-500/30"};function ie(){const{isAuthenticated:R}=U(),[m,A]=u.useState(""),[s,d]=u.useState(null),[o,b]=u.useState(0),[h,B]=u.useState(new Set),[j,F]=u.useState({}),S=y.filter(t=>t.title.toLowerCase().includes(m.toLowerCase())||t.description.toLowerCase().includes(m.toLowerCase())||t.category.toLowerCase().includes(m.toLowerCase())),g=t=>{if(!R){p.error("Sign in to enroll");return}B(i=>new Set([...i,t])),p.success("Enrolled successfully! 🎉")},C=()=>{if(!s)return;const t=s.id,i=j[t]||new Set;i.add(o),F(x=>({...x,[t]:i})),p.success(`Lesson completed! +${Math.round(s.xpReward/s.lessons)} XP`)},L=()=>{s&&(o<s.lessons-1?(C(),b(o+1)):(C(),p.success(`Course completed! 🏆 +${s.xpReward} XP, +${s.skyReward} SKY`)))};if(s){const t=s.topics[o],i=(o+1)/s.lessons*100,x=j[s.id]||new Set;return e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1104",className:"min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1105",className:"max-w-6xl mx-auto",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1107",className:"flex items-center justify-between mb-8",children:[e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1108",variant:"ghost",onClick:()=>d(null),className:"text-slate-400 hover:text-white",children:[e.jsxDEV(T,{"data-loc":"client/src/pages/SkySchool.tsx:1113",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1113,columnNumber:15},this),"Back to Courses"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1108,columnNumber:13},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1116",className:"flex items-center gap-4",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1117",className:"text-right",children:[e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1118",className:"text-sm text-slate-400",children:"Progress"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1118,columnNumber:17},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1119",className:"text-lg font-bold text-white",children:[o+1,"/",s.lessons]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1119,columnNumber:17},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1117,columnNumber:15},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1121",className:"w-40 h-3 bg-slate-800 rounded-full overflow-hidden",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1122",className:"h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500",style:{width:`${i}%`}},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1122,columnNumber:17},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1121,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1116,columnNumber:13},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1107,columnNumber:11},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1131",className:"bg-black rounded-2xl overflow-hidden mb-8 aspect-video",children:e.jsxDEV("iframe",{"data-loc":"client/src/pages/SkySchool.tsx:1132",width:"100%",height:"100%",src:`https://www.youtube.com/embed/${t.videoId}?autoplay=0`,title:t.title,frameBorder:"0",allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",allowFullScreen:!0},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1132,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1131,columnNumber:11},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1143",className:"grid grid-cols-3 gap-6",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1145",className:"col-span-2 space-y-6",children:e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1146",className:"bg-slate-900/50 border border-white/10",children:[e.jsxDEV(f,{"data-loc":"client/src/pages/SkySchool.tsx:1147",children:e.jsxDEV(v,{"data-loc":"client/src/pages/SkySchool.tsx:1148",className:"text-2xl text-white",children:t.title},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1148,columnNumber:19},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1147,columnNumber:17},this),e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1150",className:"space-y-4",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1151",className:"prose prose-invert max-w-none",children:t.content.split(`
`).map((k,c)=>e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1153",className:"text-slate-300 leading-relaxed whitespace-pre-wrap",children:k},c,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1153,columnNumber:23},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1151,columnNumber:19},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1158",className:"flex gap-3 pt-4",children:[e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1159",variant:"outline",onClick:()=>b(Math.max(0,o-1)),disabled:o===0,className:"border-slate-600 text-slate-300",children:"Previous"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1159,columnNumber:21},this),e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1167",className:"flex-1 bg-purple-600 hover:bg-purple-700",onClick:L,children:[o===s.lessons-1?"Complete Course":"Next Lesson",e.jsxDEV(M,{"data-loc":"client/src/pages/SkySchool.tsx:1172",className:"w-4 h-4 ml-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1172,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1167,columnNumber:21},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1158,columnNumber:19},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1150,columnNumber:17},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1146,columnNumber:15},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1145,columnNumber:13},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1180",className:"space-y-4",children:[e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1182",className:"bg-slate-900/50 border border-white/10",children:[e.jsxDEV(f,{"data-loc":"client/src/pages/SkySchool.tsx:1183",children:e.jsxDEV(v,{"data-loc":"client/src/pages/SkySchool.tsx:1184",className:"text-white",children:s.title},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1184,columnNumber:19},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1183,columnNumber:17},this),e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1186",className:"space-y-3 text-sm text-slate-300",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1187",className:"flex items-center gap-2",children:[e.jsxDEV(_,{"data-loc":"client/src/pages/SkySchool.tsx:1188",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1188,columnNumber:21},this),s.lessons," lessons"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1187,columnNumber:19},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1191",className:"flex items-center gap-2",children:[e.jsxDEV(V,{"data-loc":"client/src/pages/SkySchool.tsx:1192",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1192,columnNumber:21},this),s.duration]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1191,columnNumber:19},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1195",className:"flex items-center gap-2",children:[e.jsxDEV(P,{"data-loc":"client/src/pages/SkySchool.tsx:1196",className:"w-4 h-4 text-yellow-400"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1196,columnNumber:21},this),"+",s.skyReward," SKY"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1195,columnNumber:19},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1199",className:"flex items-center gap-2",children:[e.jsxDEV(I,{"data-loc":"client/src/pages/SkySchool.tsx:1200",className:"w-4 h-4 text-purple-400"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1200,columnNumber:21},this),"+",s.xpReward," XP"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1199,columnNumber:19},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1186,columnNumber:17},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1182,columnNumber:15},this),e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1207",className:"bg-slate-900/50 border border-white/10",children:[e.jsxDEV(f,{"data-loc":"client/src/pages/SkySchool.tsx:1208",children:e.jsxDEV(v,{"data-loc":"client/src/pages/SkySchool.tsx:1209",className:"text-white text-sm",children:"Lessons"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1209,columnNumber:19},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1208,columnNumber:17},this),e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1211",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1212",className:"space-y-2 max-h-96 overflow-y-auto",children:s.topics.map((k,c)=>e.jsxDEV("button",{"data-loc":"client/src/pages/SkySchool.tsx:1214",onClick:()=>b(c),className:`w-full text-left p-2 rounded transition-all text-xs ${o===c?"bg-purple-500/30 text-purple-300 border border-purple-500/50":"text-slate-400 hover:bg-slate-800/50"}`,children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1223",className:"flex items-center gap-2",children:[x.has(c)?e.jsxDEV(H,{"data-loc":"client/src/pages/SkySchool.tsx:1225",className:"w-4 h-4 text-green-500 shrink-0"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1225,columnNumber:29},this):c===o?e.jsxDEV(r,{"data-loc":"client/src/pages/SkySchool.tsx:1227",className:"w-4 h-4 text-purple-400 shrink-0"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1227,columnNumber:29},this):e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1229",className:"w-4 h-4 rounded-full border border-slate-600 shrink-0"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1229,columnNumber:29},this),e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1231",className:"truncate",children:k.title},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1231,columnNumber:27},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1223,columnNumber:25},this)},c,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1214,columnNumber:23},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1212,columnNumber:19},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1211,columnNumber:17},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1207,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1180,columnNumber:13},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1143,columnNumber:11},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1105,columnNumber:9},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1104,columnNumber:7},this)}return e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1247",className:"min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1248",className:"max-w-7xl mx-auto",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1250",className:"mb-12",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1251",className:"flex items-center gap-3 mb-4",children:[e.jsxDEV(W,{"data-loc":"client/src/pages/SkySchool.tsx:1252",className:"w-10 h-10 text-cyan-400"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1252,columnNumber:13},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1253",children:[e.jsxDEV("h1",{"data-loc":"client/src/pages/SkySchool.tsx:1254",className:"text-5xl font-bold text-white",children:"Sky School"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1254,columnNumber:15},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1255",className:"text-slate-400 text-lg mt-2",children:"Learn Web3, Coding, AI, and Hacking. Earn SKY4, XP, and Certifications."},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1255,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1253,columnNumber:13},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1251,columnNumber:11},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1250,columnNumber:9},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1261",className:"grid grid-cols-4 gap-4 mb-8",children:[e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1262",className:"bg-slate-900/50 border border-white/10",children:e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1263",className:"p-4",children:[e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1264",className:"text-slate-400 text-sm",children:"Total Courses"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1264,columnNumber:15},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1265",className:"text-3xl font-bold text-white",children:y.length},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1265,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1263,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1262,columnNumber:11},this),e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1268",className:"bg-slate-900/50 border border-white/10",children:e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1269",className:"p-4",children:[e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1270",className:"text-slate-400 text-sm",children:"Total Lessons"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1270,columnNumber:15},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1271",className:"text-3xl font-bold text-white",children:y.reduce((t,i)=>t+i.lessons,0)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1271,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1269,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1268,columnNumber:11},this),e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1274",className:"bg-slate-900/50 border border-white/10",children:e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1275",className:"p-4",children:[e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1276",className:"text-slate-400 text-sm",children:"Total Hours"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1276,columnNumber:15},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1277",className:"text-3xl font-bold text-white",children:y.reduce((t,i)=>t+parseFloat(i.duration),0).toFixed(1)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1277,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1275,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1274,columnNumber:11},this),e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1280",className:"bg-slate-900/50 border border-white/10",children:e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1281",className:"p-4",children:[e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1282",className:"text-slate-400 text-sm",children:"Enrolled"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1282,columnNumber:15},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1283",className:"text-3xl font-bold text-white",children:h.size},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1283,columnNumber:15},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1281,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1280,columnNumber:11},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1261,columnNumber:9},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1289",className:"mb-8 relative",children:[e.jsxDEV(z,{"data-loc":"client/src/pages/SkySchool.tsx:1290",className:"absolute left-4 top-3 w-5 h-5 text-slate-500"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1290,columnNumber:11},this),e.jsxDEV(K,{"data-loc":"client/src/pages/SkySchool.tsx:1291",placeholder:"Search courses by title, description, or category...",value:m,onChange:t=>A(t.target.value),className:"pl-12 h-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1291,columnNumber:11},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1289,columnNumber:9},this),e.jsxDEV(O,{"data-loc":"client/src/pages/SkySchool.tsx:1300",defaultValue:"all",className:"w-full",children:[e.jsxDEV(q,{"data-loc":"client/src/pages/SkySchool.tsx:1301",className:"bg-slate-800/50 border-b border-slate-700",children:[e.jsxDEV(w,{"data-loc":"client/src/pages/SkySchool.tsx:1302",value:"all",children:"All Courses"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1302,columnNumber:13},this),e.jsxDEV(w,{"data-loc":"client/src/pages/SkySchool.tsx:1303",value:"web3",children:"Web3"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1303,columnNumber:13},this),e.jsxDEV(w,{"data-loc":"client/src/pages/SkySchool.tsx:1304",value:"coding",children:"Coding"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1304,columnNumber:13},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1301,columnNumber:11},this),e.jsxDEV(E,{"data-loc":"client/src/pages/SkySchool.tsx:1308",value:"all",className:"mt-8",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1309",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:S.map(t=>e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1311",className:"bg-slate-900/50 border border-white/10 hover:border-cyan-500/50 transition-all overflow-hidden group cursor-pointer",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1315",className:"h-2 w-full bg-gradient-to-r from-cyan-500 to-purple-500"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1315,columnNumber:19},this),e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1316",className:"p-6",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1317",className:"flex items-start justify-between mb-4",children:[e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1318",className:"text-4xl",children:t.icon},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1318,columnNumber:23},this),e.jsxDEV(N,{"data-loc":"client/src/pages/SkySchool.tsx:1319",className:`text-xs px-2 py-1 ${D[t.level]}`,children:t.level},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1319,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1317,columnNumber:21},this),e.jsxDEV("h3",{"data-loc":"client/src/pages/SkySchool.tsx:1323",className:"font-bold text-white text-lg mb-2 group-hover:text-cyan-300 transition-colors",children:t.title},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1323,columnNumber:21},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1326",className:"text-slate-400 text-sm mb-4",children:t.description},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1326,columnNumber:21},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1327",className:"flex items-center justify-between text-xs text-slate-400 mb-4",children:[e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1328",className:"flex items-center gap-1",children:[e.jsxDEV(_,{"data-loc":"client/src/pages/SkySchool.tsx:1329",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1329,columnNumber:25},this),t.lessons," lessons"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1328,columnNumber:23},this),e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1331",className:"flex items-center gap-1",children:[e.jsxDEV(V,{"data-loc":"client/src/pages/SkySchool.tsx:1332",className:"w-4 h-4"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1332,columnNumber:25},this),t.duration]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1331,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1327,columnNumber:21},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1335",className:"flex items-center justify-between mb-4",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1336",className:"flex items-center gap-3",children:[e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1337",className:"text-xs text-yellow-400 font-semibold flex items-center gap-1",children:[e.jsxDEV(P,{"data-loc":"client/src/pages/SkySchool.tsx:1338",className:"w-3 h-3"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1338,columnNumber:27},this),"+",t.skyReward," SKY"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1337,columnNumber:25},this),e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1340",className:"text-xs text-purple-400 flex items-center gap-1",children:[e.jsxDEV(I,{"data-loc":"client/src/pages/SkySchool.tsx:1341",className:"w-3 h-3"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1341,columnNumber:27},this),"+",t.xpReward," XP"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1340,columnNumber:25},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1336,columnNumber:23},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1335,columnNumber:21},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1345",className:"flex gap-2",children:h.has(t.id)?e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1347",className:"flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30",onClick:()=>d(t),children:[e.jsxDEV(r,{"data-loc":"client/src/pages/SkySchool.tsx:1351",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1351,columnNumber:27},this),"Continue"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1347,columnNumber:25},this):e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1355",className:"flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/30",onClick:()=>g(t.id),children:[e.jsxDEV(r,{"data-loc":"client/src/pages/SkySchool.tsx:1359",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1359,columnNumber:27},this),"Enroll"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1355,columnNumber:25},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1345,columnNumber:21},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1316,columnNumber:19},this)]},t.id,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1311,columnNumber:17},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1309,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1308,columnNumber:11},this),e.jsxDEV(E,{"data-loc":"client/src/pages/SkySchool.tsx:1371",value:"web3",className:"mt-8",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1372",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:S.filter(t=>t.track==="web3").map(t=>e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1374",className:"bg-slate-900/50 border border-white/10 hover:border-cyan-500/50 transition-all overflow-hidden group cursor-pointer",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1375",className:"h-2 w-full bg-gradient-to-r from-cyan-500 to-purple-500"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1375,columnNumber:19},this),e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1376",className:"p-6",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1377",className:"flex items-start justify-between mb-4",children:[e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1378",className:"text-4xl",children:t.icon},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1378,columnNumber:23},this),e.jsxDEV(N,{"data-loc":"client/src/pages/SkySchool.tsx:1379",className:`text-xs px-2 py-1 ${D[t.level]}`,children:t.level},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1379,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1377,columnNumber:21},this),e.jsxDEV("h3",{"data-loc":"client/src/pages/SkySchool.tsx:1383",className:"font-bold text-white text-lg mb-2",children:t.title},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1383,columnNumber:21},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1384",className:"text-slate-400 text-sm mb-4",children:t.description},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1384,columnNumber:21},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1385",className:"flex gap-2",children:h.has(t.id)?e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1387",className:"flex-1 bg-green-600/20 text-green-300",onClick:()=>d(t),children:[e.jsxDEV(r,{"data-loc":"client/src/pages/SkySchool.tsx:1388",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1388,columnNumber:27},this),"Continue"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1387,columnNumber:25},this):e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1392",className:"flex-1 bg-cyan-500/20 text-cyan-300",onClick:()=>g(t.id),children:[e.jsxDEV(r,{"data-loc":"client/src/pages/SkySchool.tsx:1393",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1393,columnNumber:27},this),"Enroll"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1392,columnNumber:25},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1385,columnNumber:21},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1376,columnNumber:19},this)]},t.id,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1374,columnNumber:17},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1372,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1371,columnNumber:11},this),e.jsxDEV(E,{"data-loc":"client/src/pages/SkySchool.tsx:1405",value:"coding",className:"mt-8",children:e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1406",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:S.filter(t=>t.track==="coding").map(t=>e.jsxDEV(a,{"data-loc":"client/src/pages/SkySchool.tsx:1408",className:"bg-slate-900/50 border border-white/10 hover:border-cyan-500/50 transition-all overflow-hidden group cursor-pointer",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1409",className:"h-2 w-full bg-gradient-to-r from-cyan-500 to-purple-500"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1409,columnNumber:19},this),e.jsxDEV(n,{"data-loc":"client/src/pages/SkySchool.tsx:1410",className:"p-6",children:[e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1411",className:"flex items-start justify-between mb-4",children:[e.jsxDEV("span",{"data-loc":"client/src/pages/SkySchool.tsx:1412",className:"text-4xl",children:t.icon},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1412,columnNumber:23},this),e.jsxDEV(N,{"data-loc":"client/src/pages/SkySchool.tsx:1413",className:`text-xs px-2 py-1 ${D[t.level]}`,children:t.level},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1413,columnNumber:23},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1411,columnNumber:21},this),e.jsxDEV("h3",{"data-loc":"client/src/pages/SkySchool.tsx:1417",className:"font-bold text-white text-lg mb-2",children:t.title},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1417,columnNumber:21},this),e.jsxDEV("p",{"data-loc":"client/src/pages/SkySchool.tsx:1418",className:"text-slate-400 text-sm mb-4",children:t.description},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1418,columnNumber:21},this),e.jsxDEV("div",{"data-loc":"client/src/pages/SkySchool.tsx:1419",className:"flex gap-2",children:h.has(t.id)?e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1421",className:"flex-1 bg-green-600/20 text-green-300",onClick:()=>d(t),children:[e.jsxDEV(r,{"data-loc":"client/src/pages/SkySchool.tsx:1422",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1422,columnNumber:27},this),"Continue"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1421,columnNumber:25},this):e.jsxDEV(l,{"data-loc":"client/src/pages/SkySchool.tsx:1426",className:"flex-1 bg-cyan-500/20 text-cyan-300",onClick:()=>g(t.id),children:[e.jsxDEV(r,{"data-loc":"client/src/pages/SkySchool.tsx:1427",className:"w-4 h-4 mr-2"},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1427,columnNumber:27},this),"Enroll"]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1426,columnNumber:25},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1419,columnNumber:21},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1410,columnNumber:19},this)]},t.id,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1408,columnNumber:17},this))},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1406,columnNumber:13},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1405,columnNumber:11},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1300,columnNumber:9},this)]},void 0,!0,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1248,columnNumber:7},this)},void 0,!1,{fileName:"/home/ubuntu/skycoin_production/client/src/pages/SkySchool.tsx",lineNumber:1247,columnNumber:5},this)}export{ie as default};
