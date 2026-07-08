import { LessonContent } from "@/components/InteractiveLesson";

export const CRYPTO_LESSONS: LessonContent[] = [
  {
    id: "btc-101",
    title: "Bitcoin Fundamentals",
    reading: `Bitcoin is a decentralized digital currency created in 2009 by an anonymous person or group known as Satoshi Nakamoto. It operates on a peer-to-peer network without requiring a central authority like a bank.

Key Concepts:
- Blockchain: A distributed ledger that records all Bitcoin transactions
- Mining: The process of validating transactions and creating new bitcoins
- Wallets: Digital tools that store your private and public keys
- Transactions: Transfers of bitcoin from one address to another

How Bitcoin Works:
1. You initiate a transaction using your private key
2. The transaction is broadcast to the network
3. Miners validate the transaction using cryptographic proofs
4. Once validated, the transaction is added to a block
5. The block is added to the blockchain
6. The transaction is complete and immutable

Bitcoin Supply:
- Total supply: 21 million BTC (fixed)
- Current circulation: ~21 million BTC
- Mining reward: Started at 50 BTC, halves every 210,000 blocks
- Last halving: 2024, reward is now 3.125 BTC per block

Security:
Bitcoin uses SHA-256 hashing and ECDSA for cryptographic security. The proof-of-work consensus mechanism ensures that altering past transactions would require more computational power than the entire network combined.`,
    keyPoints: [
      "Bitcoin is a decentralized peer-to-peer currency with no central authority",
      "The blockchain is an immutable ledger of all transactions",
      "Mining secures the network and creates new bitcoins",
      "Private keys control access to your bitcoins",
      "The supply is capped at 21 million bitcoins"
    ],
    quiz: [
      {
        id: "q1",
        question: "Who created Bitcoin?",
        options: [
          "Satoshi Nakamoto (anonymous)",
          "Vitalik Buterin",
          "Charlie Lee",
          "The US Federal Reserve"
        ],
        correctAnswer: 0,
        explanation: "Bitcoin was created by an anonymous person or group known as Satoshi Nakamoto in 2009."
      },
      {
        id: "q2",
        question: "What is the total supply cap of Bitcoin?",
        options: [
          "100 million BTC",
          "21 million BTC",
          "1 billion BTC",
          "Unlimited"
        ],
        correctAnswer: 1,
        explanation: "Bitcoin has a fixed supply cap of 21 million BTC, which is a key feature of its design."
      },
      {
        id: "q3",
        question: "What process secures the Bitcoin network?",
        options: [
          "Proof of Stake",
          "Proof of Work",
          "Proof of Authority",
          "Proof of History"
        ],
        correctAnswer: 1,
        explanation: "Bitcoin uses Proof of Work consensus, where miners solve complex cryptographic puzzles to validate transactions."
      },
      {
        id: "q4",
        question: "How often does Bitcoin's mining reward halve?",
        options: [
          "Every year",
          "Every 100,000 blocks",
          "Every 210,000 blocks",
          "Never"
        ],
        correctAnswer: 2,
        explanation: "Bitcoin's mining reward halves every 210,000 blocks, approximately every 4 years."
      },
      {
        id: "q5",
        question: "What cryptographic algorithm does Bitcoin use for signatures?",
        options: [
          "RSA",
          "ECDSA",
          "AES",
          "MD5"
        ],
        correctAnswer: 1,
        explanation: "Bitcoin uses ECDSA (Elliptic Curve Digital Signature Algorithm) for transaction signatures."
      }
    ],
    xpReward: 500,
    skyReward: 50
  },
  {
    id: "eth-101",
    title: "Ethereum & Smart Contracts",
    reading: `Ethereum is a decentralized platform that enables developers to build and deploy smart contracts and decentralized applications (dApps). Created by Vitalik Buterin in 2015, Ethereum introduced programmability to blockchain.

Smart Contracts:
- Self-executing code stored on the blockchain
- Automatically execute when conditions are met
- Immutable once deployed
- Enable complex financial and organizational logic

Ethereum Virtual Machine (EVM):
- Executes smart contract code
- Ensures deterministic execution across all nodes
- Uses "gas" as a resource metering mechanism
- Supports multiple programming languages (Solidity, Vyper, etc.)

Tokens on Ethereum:
- ERC-20: Fungible tokens (like currencies)
- ERC-721: Non-fungible tokens (NFTs)
- ERC-1155: Multi-token standard
- Custom tokens can be created by anyone

Consensus Mechanisms:
- Originally used Proof of Work (like Bitcoin)
- Transitioned to Proof of Stake in 2022 (The Merge)
- Proof of Stake is more energy-efficient
- Validators stake ETH to participate in consensus

DeFi (Decentralized Finance):
- Lending protocols: Aave, Compound
- Decentralized exchanges: Uniswap, Curve
- Derivatives: Synthetix, dYdX
- Yield farming: Earn rewards by providing liquidity

Gas and Fees:
- Gas measures computational work
- Gas price fluctuates based on network demand
- Total fee = Gas used × Gas price (in Gwei)
- Layer 2 solutions reduce gas costs significantly`,
    keyPoints: [
      "Ethereum enables smart contracts and decentralized applications",
      "The EVM executes code deterministically across the network",
      "Gas metering prevents spam and allocates network resources",
      "Multiple token standards (ERC-20, ERC-721) enable different use cases",
      "Ethereum transitioned from Proof of Work to Proof of Stake"
    ],
    quiz: [
      {
        id: "q1",
        question: "Who created Ethereum?",
        options: [
          "Satoshi Nakamoto",
          "Vitalik Buterin",
          "Charlie Lee",
          "Gavin Wood"
        ],
        correctAnswer: 1,
        explanation: "Ethereum was created by Vitalik Buterin in 2015."
      },
      {
        id: "q2",
        question: "What is a smart contract?",
        options: [
          "A legal document signed by lawyers",
          "Self-executing code stored on the blockchain",
          "A traditional insurance contract",
          "A cryptocurrency wallet"
        ],
        correctAnswer: 1,
        explanation: "A smart contract is self-executing code that runs on the blockchain and automatically executes when conditions are met."
      },
      {
        id: "q3",
        question: "What does ERC-20 represent?",
        options: [
          "Non-fungible tokens",
          "Fungible tokens (like currencies)",
          "A consensus mechanism",
          "A blockchain layer"
        ],
        correctAnswer: 1,
        explanation: "ERC-20 is the standard for fungible tokens on Ethereum, similar to how currencies work."
      },
      {
        id: "q4",
        question: "What is 'The Merge' in Ethereum?",
        options: [
          "Combining two blockchains",
          "Transition from Proof of Work to Proof of Stake",
          "Merging smart contracts",
          "Combining wallets"
        ],
        correctAnswer: 1,
        explanation: "The Merge was Ethereum's transition from Proof of Work to Proof of Stake consensus in 2022."
      },
      {
        id: "q5",
        question: "What is gas in Ethereum?",
        options: [
          "A cryptocurrency",
          "A measure of computational work required to execute transactions",
          "A type of wallet",
          "A mining pool"
        ],
        correctAnswer: 1,
        explanation: "Gas measures the computational work required to execute transactions and smart contracts on Ethereum."
      }
    ],
    xpReward: 600,
    skyReward: 60
  },
  {
    id: "defi-101",
    title: "Decentralized Finance (DeFi)",
    reading: `Decentralized Finance (DeFi) refers to financial services built on blockchain networks without traditional intermediaries like banks. DeFi enables anyone with a crypto wallet to access financial services globally.

Core DeFi Concepts:
- Permissionless: Anyone can participate without KYC
- Transparent: All transactions and smart contracts are visible
- Composable: Protocols can interact with each other ("money legos")
- Non-custodial: Users control their own funds

Major DeFi Categories:

1. Lending & Borrowing:
   - Users deposit crypto to earn interest
   - Borrowers take loans by collateralizing assets
   - Interest rates determined by supply and demand
   - Examples: Aave, Compound, MakerDAO

2. Decentralized Exchanges (DEXs):
   - Trade cryptocurrencies without a central authority
   - Automated Market Makers (AMMs) use liquidity pools
   - Liquidity providers earn trading fees
   - Examples: Uniswap, Curve, Balancer

3. Derivatives:
   - Perpetual futures contracts
   - Options and synthetic assets
   - Price exposure without owning the asset
   - Examples: dYdX, Synthetix

4. Yield Farming:
   - Earn rewards by providing liquidity or staking
   - Can involve multiple protocols (composability)
   - Higher yields often mean higher risks
   - Requires active management

Risks in DeFi:
- Smart contract vulnerabilities
- Impermanent loss for liquidity providers
- Market volatility and liquidation risks
- Regulatory uncertainty
- Rug pulls and scams

Best Practices:
- Start with established protocols
- Understand the risks before investing
- Use hardware wallets for large amounts
- Diversify across multiple protocols
- Keep private keys secure`,
    keyPoints: [
      "DeFi enables financial services without traditional intermediaries",
      "Permissionless access means anyone can participate globally",
      "AMMs and liquidity pools power decentralized exchanges",
      "Composability allows protocols to interact ('money legos')",
      "Higher yields come with higher risks - always research first"
    ],
    quiz: [
      {
        id: "q1",
        question: "What does DeFi stand for?",
        options: [
          "Digital Finance",
          "Decentralized Finance",
          "Distributed Finance",
          "Derivative Finance"
        ],
        correctAnswer: 1,
        explanation: "DeFi stands for Decentralized Finance, which provides financial services without traditional intermediaries."
      },
      {
        id: "q2",
        question: "What is an Automated Market Maker (AMM)?",
        options: [
          "A person who manages markets",
          "A smart contract that uses liquidity pools to enable trading",
          "A centralized exchange",
          "A type of wallet"
        ],
        correctAnswer: 1,
        explanation: "An AMM is a smart contract that uses liquidity pools to enable trading without a central order book."
      },
      {
        id: "q3",
        question: "What is impermanent loss?",
        options: [
          "Loss from trading mistakes",
          "Loss when a protocol shuts down",
          "Loss for liquidity providers when token prices diverge",
          "Loss from hacking"
        ],
        correctAnswer: 2,
        explanation: "Impermanent loss occurs when the price ratio of tokens in a liquidity pool changes significantly."
      },
      {
        id: "q4",
        question: "What does 'permissionless' mean in DeFi?",
        options: [
          "You need permission from the government",
          "Anyone can participate without KYC or approval",
          "Only institutions can participate",
          "You need to ask the protocol owner"
        ],
        correctAnswer: 1,
        explanation: "Permissionless means anyone with a crypto wallet can participate without KYC or approval from a central authority."
      },
      {
        id: "q5",
        question: "What are 'money legos' in DeFi?",
        options: [
          "Physical cryptocurrency tokens",
          "Protocols that can be composed together",
          "A type of wallet",
          "Mining equipment"
        ],
        correctAnswer: 1,
        explanation: "'Money legos' refers to the composability of DeFi protocols - they can be combined and interact with each other."
      }
    ],
    xpReward: 700,
    skyReward: 70
  }
];
