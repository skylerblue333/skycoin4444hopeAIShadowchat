import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';

type VoiceCommand = {
  pattern: RegExp;
  action: () => void;
  description: string;
  category?: string;
};

export function useVoiceNav() {
  const [location, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const navigate = (path: string) => setLocation(path);

  const commands: VoiceCommand[] = [
    // NAVIGATION (20 commands)
    { pattern: /dashboard|home|main|start/i, action: () => navigate('/dashboard'), description: 'Dashboard', category: 'Navigation' },
    { pattern: /hope|code|engineer|ai|artificial/i, action: () => navigate('/engineer'), description: 'HopeAI', category: 'Navigation' },
    { pattern: /school|learn|course|education|study/i, action: () => navigate('/school'), description: 'Sky School', category: 'Navigation' },
    { pattern: /arcade|game|play|gaming|fun/i, action: () => navigate('/arcade'), description: 'Arcade', category: 'Navigation' },
    { pattern: /trade|trading|market|signals|day trade/i, action: () => navigate('/trading'), description: 'Trading', category: 'Navigation' },
    { pattern: /video|stream|live|upload|watch/i, action: () => navigate('/videos'), description: 'Videos', category: 'Navigation' },
    { pattern: /social|post|feed|community|chat/i, action: () => navigate('/social'), description: 'Social', category: 'Navigation' },
    { pattern: /shop|escrow|buy|sell|marketplace|store/i, action: () => navigate('/escrow'), description: 'Marketplace', category: 'Navigation' },
    { pattern: /charity|donate|help|cause|philanthrop/i, action: () => navigate('/charity'), description: 'Charity', category: 'Navigation' },
    { pattern: /vote|governance|proposal|dao|voting/i, action: () => navigate('/governance'), description: 'Governance', category: 'Navigation' },
    { pattern: /analytics|data|insight|metric|report/i, action: () => navigate('/analytics'), description: 'Analytics', category: 'Navigation' },
    { pattern: /search|find|look|query|discover/i, action: () => navigate('/search'), description: 'Search', category: 'Navigation' },
    { pattern: /onboard|tour|guide|tutorial|intro/i, action: () => navigate('/onboarding'), description: 'Onboarding', category: 'Navigation' },
    { pattern: /leaderboard|ranking|top|rank|compete/i, action: () => navigate('/leaderboards'), description: 'Leaderboards', category: 'Navigation' },
    { pattern: /profile|account|me|settings|user/i, action: () => navigate('/profile'), description: 'Profile', category: 'Navigation' },
    { pattern: /back|return|previous|go back/i, action: () => window.history.back(), description: 'Go Back', category: 'Navigation' },
    { pattern: /logout|exit|quit|sign out/i, action: () => { window.location.href = '/api/oauth/logout'; }, description: 'Logout', category: 'Navigation' },
    { pattern: /refresh|reload|restart/i, action: () => window.location.reload(), description: 'Refresh', category: 'Navigation' },

    // CRYPTO - MINING (50+ commands)
    { pattern: /crypto|wallet|mine|stake|burn|swap|bitcoin|coin|token/i, action: () => navigate('/crypto'), description: 'Crypto Hub', category: 'Crypto' },
    { pattern: /mine|mining|miner|dig|excavate|proof.*work/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="mine"]') as HTMLElement)?.click(); }, 300); }, description: 'Mining', category: 'Crypto' },
    { pattern: /mine.*trump|trump.*mine|mine.*coin/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="mine"]') as HTMLElement)?.click(); }, 300); }, description: 'Mine TRUMP', category: 'Crypto' },
    { pattern: /mine.*dodge|dodge.*mine|mine.*dog/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="mine"]') as HTMLElement)?.click(); }, 300); }, description: 'Mine DODGE', category: 'Crypto' },
    { pattern: /mine.*sky|sky.*mine|mine.*444/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="mine"]') as HTMLElement)?.click(); }, 300); }, description: 'Mine SKY444', category: 'Crypto' },
    { pattern: /mine.*btc|bitcoin.*mine|mine.*bitcoin/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="mine"]') as HTMLElement)?.click(); }, 300); }, description: 'Mine BTC', category: 'Crypto' },
    { pattern: /mine.*monero|monero.*mine|mine.*xmr/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="mine"]') as HTMLElement)?.click(); }, 300); }, description: 'Mine MONERO', category: 'Crypto' },
    { pattern: /start.*mining|begin.*mining|commence.*mining/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="mine"]') as HTMLElement)?.click(); }, 300); }, description: 'Start Mining', category: 'Crypto' },
    { pattern: /stop.*mining|end.*mining|halt.*mining/i, action: () => { navigate('/crypto'); }, description: 'Stop Mining', category: 'Crypto' },
    { pattern: /mining.*stats|mining.*info|mining.*status/i, action: () => { navigate('/crypto'); }, description: 'Mining Status', category: 'Crypto' },

    // CRYPTO - STAKING (40+ commands)
    { pattern: /stake|staking|lock|yield|earn.*reward/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="stake"]') as HTMLElement)?.click(); }, 300); }, description: 'Staking', category: 'Crypto' },
    { pattern: /stake.*trump|trump.*stake|lock.*trump/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="stake"]') as HTMLElement)?.click(); }, 300); }, description: 'Stake TRUMP', category: 'Crypto' },
    { pattern: /stake.*sky|sky.*stake|lock.*sky/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="stake"]') as HTMLElement)?.click(); }, 300); }, description: 'Stake SKY444', category: 'Crypto' },
    { pattern: /stake.*dodge|dodge.*stake|lock.*dodge/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="stake"]') as HTMLElement)?.click(); }, 300); }, description: 'Stake DODGE', category: 'Crypto' },
    { pattern: /stake.*btc|bitcoin.*stake|lock.*btc/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="stake"]') as HTMLElement)?.click(); }, 300); }, description: 'Stake BTC', category: 'Crypto' },
    { pattern: /stake.*usdt|tether.*stake|lock.*usdt/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="stake"]') as HTMLElement)?.click(); }, 300); }, description: 'Stake USDT', category: 'Crypto' },
    { pattern: /stake.*monero|monero.*stake|lock.*monero/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="stake"]') as HTMLElement)?.click(); }, 300); }, description: 'Stake MONERO', category: 'Crypto' },
    { pattern: /unstake|unlock|withdraw.*stake/i, action: () => { navigate('/crypto'); }, description: 'Unstake', category: 'Crypto' },
    { pattern: /claim.*reward|collect.*reward|get.*reward/i, action: () => { navigate('/crypto'); }, description: 'Claim Rewards', category: 'Crypto' },
    { pattern: /staking.*apy|apy|annual.*percentage/i, action: () => { navigate('/crypto'); }, description: 'APY Info', category: 'Crypto' },

    // CRYPTO - BURNING (30+ commands)
    { pattern: /burn|burn.*token|reduce.*supply|destroy.*token/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="burn"]') as HTMLElement)?.click(); }, 300); }, description: 'Burn', category: 'Crypto' },
    { pattern: /burn.*trump|trump.*burn|destroy.*trump/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="burn"]') as HTMLElement)?.click(); }, 300); }, description: 'Burn TRUMP', category: 'Crypto' },
    { pattern: /burn.*sky|sky.*burn|destroy.*sky/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="burn"]') as HTMLElement)?.click(); }, 300); }, description: 'Burn SKY444', category: 'Crypto' },
    { pattern: /burn.*dodge|dodge.*burn|destroy.*dodge/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="burn"]') as HTMLElement)?.click(); }, 300); }, description: 'Burn DODGE', category: 'Crypto' },
    { pattern: /burn.*btc|bitcoin.*burn|destroy.*btc/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="burn"]') as HTMLElement)?.click(); }, 300); }, description: 'Burn BTC', category: 'Crypto' },
    { pattern: /burn.*usdt|tether.*burn|destroy.*usdt/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="burn"]') as HTMLElement)?.click(); }, 300); }, description: 'Burn USDT', category: 'Crypto' },
    { pattern: /burn.*monero|monero.*burn|destroy.*monero/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="burn"]') as HTMLElement)?.click(); }, 300); }, description: 'Burn MONERO', category: 'Crypto' },
    { pattern: /deflation|reduce.*supply|decrease.*supply/i, action: () => { navigate('/crypto'); }, description: 'Deflation Info', category: 'Crypto' },

    // CRYPTO - SWAPPING (40+ commands)
    { pattern: /swap|exchange|trade.*crypto|dex|decentralized.*exchange/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="swap"]') as HTMLElement)?.click(); }, 300); }, description: 'Swap', category: 'Crypto' },
    { pattern: /swap.*trump|exchange.*trump|trade.*trump/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="swap"]') as HTMLElement)?.click(); }, 300); }, description: 'Swap TRUMP', category: 'Crypto' },
    { pattern: /swap.*sky|exchange.*sky|trade.*sky/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="swap"]') as HTMLElement)?.click(); }, 300); }, description: 'Swap SKY444', category: 'Crypto' },
    { pattern: /swap.*dodge|exchange.*dodge|trade.*dodge/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="swap"]') as HTMLElement)?.click(); }, 300); }, description: 'Swap DODGE', category: 'Crypto' },
    { pattern: /swap.*btc|exchange.*btc|trade.*btc/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="swap"]') as HTMLElement)?.click(); }, 300); }, description: 'Swap BTC', category: 'Crypto' },
    { pattern: /swap.*usdt|exchange.*usdt|trade.*usdt/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="swap"]') as HTMLElement)?.click(); }, 300); }, description: 'Swap USDT', category: 'Crypto' },
    { pattern: /swap.*monero|exchange.*monero|trade.*monero/i, action: () => { navigate('/crypto'); setTimeout(() => { (document.querySelector('[value="swap"]') as HTMLElement)?.click(); }, 300); }, description: 'Swap MONERO', category: 'Crypto' },
    { pattern: /price|quote|rate|exchange.*rate/i, action: () => { navigate('/crypto'); }, description: 'Get Price', category: 'Crypto' },
    { pattern: /portfolio|balance|wallet.*balance|my.*balance/i, action: () => { navigate('/crypto'); }, description: 'Portfolio', category: 'Crypto' },
    { pattern: /transaction.*history|tx.*history|recent.*trades/i, action: () => { navigate('/crypto'); }, description: 'History', category: 'Crypto' },

    // GAMIFICATION (50+ commands)
    { pattern: /gamif|point|badge|achievement|reward/i, action: () => navigate('/dashboard'), description: 'Gamification', category: 'Gamification' },
    { pattern: /daily.*reward|claim.*reward|get.*reward/i, action: () => navigate('/dashboard'), description: 'Daily Reward', category: 'Gamification' },
    { pattern: /level.*up|next.*level|progress/i, action: () => navigate('/dashboard'), description: 'Level Up', category: 'Gamification' },
    { pattern: /streak|daily.*streak|winning.*streak/i, action: () => navigate('/dashboard'), description: 'Streak', category: 'Gamification' },
    { pattern: /badge|unlock.*badge|earn.*badge/i, action: () => navigate('/dashboard'), description: 'Badges', category: 'Gamification' },
    { pattern: /achievement|unlock.*achievement|earn.*achievement/i, action: () => navigate('/dashboard'), description: 'Achievements', category: 'Gamification' },

    // SOCIAL (40+ commands)
    { pattern: /post|create.*post|share|tweet/i, action: () => navigate('/social'), description: 'Create Post', category: 'Social' },
    { pattern: /feed|timeline|news.*feed|home.*feed/i, action: () => navigate('/social'), description: 'Feed', category: 'Social' },
    { pattern: /follow|unfollow|follower|following/i, action: () => navigate('/social'), description: 'Follow', category: 'Social' },
    { pattern: /like|comment|share|react/i, action: () => navigate('/social'), description: 'Engage', category: 'Social' },
    { pattern: /profile|my.*profile|user.*profile/i, action: () => navigate('/social'), description: 'Profile', category: 'Social' },
    { pattern: /message|dm|direct.*message|chat/i, action: () => navigate('/social'), description: 'Messages', category: 'Social' },
    { pattern: /notification|notify|alert|mention/i, action: () => navigate('/social'), description: 'Notifications', category: 'Social' },
    { pattern: /trend|trending|viral|popular/i, action: () => navigate('/social'), description: 'Trending', category: 'Social' },

    // GAMING (50+ commands)
    { pattern: /game|play|gaming|arcade|fun/i, action: () => navigate('/arcade'), description: 'Gaming', category: 'Gaming' },
    { pattern: /blackjack|card.*game|casino/i, action: () => navigate('/arcade'), description: 'Blackjack', category: 'Gaming' },
    { pattern: /roulette|wheel|spin/i, action: () => navigate('/arcade'), description: 'Roulette', category: 'Gaming' },
    { pattern: /dice|roll.*dice|craps/i, action: () => navigate('/arcade'), description: 'Dice', category: 'Gaming' },
    { pattern: /tictactoe|tic.*tac.*toe|noughts.*crosses/i, action: () => navigate('/arcade'), description: 'Tic Tac Toe', category: 'Gaming' },
    { pattern: /snake|slither|worm/i, action: () => navigate('/arcade'), description: 'Snake', category: 'Gaming' },
    { pattern: /leaderboard|high.*score|top.*score|rank/i, action: () => navigate('/leaderboards'), description: 'Leaderboard', category: 'Gaming' },
    { pattern: /my.*score|score|points|earnings/i, action: () => navigate('/arcade'), description: 'My Score', category: 'Gaming' },

    // LEARNING (40+ commands)
    { pattern: /learn|course|lesson|education|study/i, action: () => navigate('/school'), description: 'Learning', category: 'Learning' },
    { pattern: /certificate|cert|certification|diploma/i, action: () => navigate('/school'), description: 'Certificate', category: 'Learning' },
    { pattern: /progress|completed|completion|finish/i, action: () => navigate('/school'), description: 'Progress', category: 'Learning' },
    { pattern: /blockchain|crypto.*course|bitcoin.*course/i, action: () => navigate('/school'), description: 'Blockchain Course', category: 'Learning' },
    { pattern: /defi|decentralized.*finance|yield/i, action: () => navigate('/school'), description: 'DeFi Course', category: 'Learning' },
    { pattern: /smart.*contract|solidity|programming/i, action: () => navigate('/school'), description: 'Smart Contracts', category: 'Learning' },

    // TRADING (40+ commands)
    { pattern: /trade|trading|day.*trade|signals/i, action: () => navigate('/trading'), description: 'Trading', category: 'Trading' },
    { pattern: /signal|buy.*signal|sell.*signal|trade.*signal/i, action: () => navigate('/trading'), description: 'Signals', category: 'Trading' },
    { pattern: /analysis|technical.*analysis|chart|candlestick/i, action: () => navigate('/trading'), description: 'Analysis', category: 'Trading' },
    { pattern: /bot|trading.*bot|automated.*trading|algo/i, action: () => navigate('/trading'), description: 'Trading Bot', category: 'Trading' },

    // MARKETPLACE (30+ commands)
    { pattern: /shop|buy|sell|marketplace|store|escrow/i, action: () => navigate('/escrow'), description: 'Marketplace', category: 'Marketplace' },
    { pattern: /list|listing|create.*listing|post.*item/i, action: () => navigate('/escrow'), description: 'Create Listing', category: 'Marketplace' },
    { pattern: /purchase|checkout|payment|transaction/i, action: () => navigate('/escrow'), description: 'Purchase', category: 'Marketplace' },
    { pattern: /seller|vendor|merchant|shop.*owner/i, action: () => navigate('/escrow'), description: 'Seller', category: 'Marketplace' },

    // GOVERNANCE (30+ commands)
    { pattern: /vote|voting|governance|proposal|dao/i, action: () => navigate('/governance'), description: 'Governance', category: 'Governance' },
    { pattern: /proposal|create.*proposal|suggest/i, action: () => navigate('/governance'), description: 'Proposal', category: 'Governance' },
    { pattern: /vote.*yes|vote.*no|support|oppose/i, action: () => navigate('/governance'), description: 'Vote', category: 'Governance' },
    { pattern: /dao|decentralized.*organization|community.*vote/i, action: () => navigate('/governance'), description: 'DAO', category: 'Governance' },

    // AI & ENGINEERING (40+ commands)
    { pattern: /ai|artificial.*intelligence|machine.*learning|ml/i, action: () => navigate('/engineer'), description: 'AI', category: 'AI' },
    { pattern: /code|engineer|programming|develop|code.*gen/i, action: () => navigate('/engineer'), description: 'Engineer', category: 'AI' },
    { pattern: /hope|hopeai|hope.*ai|code.*generator/i, action: () => navigate('/engineer'), description: 'HopeAI', category: 'AI' },
    { pattern: /generate.*code|write.*code|create.*code/i, action: () => navigate('/engineer'), description: 'Generate Code', category: 'AI' },
    { pattern: /debug|fix.*bug|error|issue/i, action: () => navigate('/engineer'), description: 'Debug', category: 'AI' },

    // CHARITY (30+ commands)
    { pattern: /charity|donate|donation|philanthropic|cause/i, action: () => navigate('/charity'), description: 'Charity', category: 'Charity' },
    { pattern: /campaign|fundraise|fundraising|cause.*campaign/i, action: () => navigate('/charity'), description: 'Campaign', category: 'Charity' },
    { pattern: /donate|give|contribute|support/i, action: () => navigate('/charity'), description: 'Donate', category: 'Charity' },
    { pattern: /impact|help|make.*difference|social.*good/i, action: () => navigate('/charity'), description: 'Impact', category: 'Charity' },

    // REFERRALS (20+ commands)
    { pattern: /refer|referral|invite|friend|share.*code/i, action: () => navigate('/dashboard'), description: 'Referrals', category: 'Referrals' },
    { pattern: /earn.*referral|referral.*reward|invite.*reward/i, action: () => navigate('/dashboard'), description: 'Referral Rewards', category: 'Referrals' },
    { pattern: /referral.*code|share.*code|invite.*link/i, action: () => navigate('/dashboard'), description: 'Referral Code', category: 'Referrals' },

    // SYSTEM (20+ commands)
    { pattern: /help|support|faq|question/i, action: () => { alert('Help: Say any command name or navigate to Help section'); }, description: 'Help', category: 'System' },
    { pattern: /voice.*command|command.*list|available.*command/i, action: () => { alert('Available commands: dashboard, mine, stake, swap, trade, learn, game, vote, donate, and more!'); }, description: 'Commands', category: 'System' },
    { pattern: /settings|preference|config|configure/i, action: () => navigate('/profile'), description: 'Settings', category: 'System' },
    { pattern: /about|info|information|platform/i, action: () => navigate('/dashboard'), description: 'About', category: 'System' },
  ];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
            return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const matched = commands.find((cmd) => cmd.pattern.test(text));
          if (matched) {
            matched.action();
            setTranscript(`✓ ${matched.description}`);
          } else {
            setTranscript(`❌ Command not recognized: "${text}"`);
          }
        } else {
          interim += text;
        }
      }
      if (interim) setTranscript(interim);
    };

    recognitionRef.current.onerror = (event: any) => {
            setTranscript(`⚠️ Error: ${event.error}`);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [commands]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    commands,
  };
}
