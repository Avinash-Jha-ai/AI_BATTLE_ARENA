import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Trophy } from 'lucide-react';
import './App.css';

interface BattleResult {
  problem: string;
  solution_1: string;
  solution_2: string;
  judge?: {
    solution_1_score: number;
    solution_2_score: number;
    solution_1_reasoning: string;
    solution_2_reasoning: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  battleData?: BattleResult;
}

// Extractor function to handle strings containing JSON (e.g., from prompt output)
const extractJSON = (text: string): any | null => {
  try {
    if (typeof text === 'object' && text !== null) return text;
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonString = match ? match[1] : text;
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};

const BattleCard = ({ data }: { data: BattleResult }) => {
  const isS1Winner = (data.judge?.solution_1_score ?? 0) >= (data.judge?.solution_2_score ?? 0);
  const isS2Winner = (data.judge?.solution_2_score ?? 0) >= (data.judge?.solution_1_score ?? 0);

  return (
    <div className="battle-card">
      <div className="solutions-container">
        <div className={`solution-box ${isS1Winner ? 'winner' : ''}`}>
          <div className="solution-header">
            <h4>Model 1</h4>
            {isS1Winner && data.judge && <Trophy size={18} className="trophy-icon" />}
          </div>
          <div className="solution-content">{data.solution_1}</div>
          {data.judge && (
            <div className="judge-box">
              <div className="score-badge">Score: {data.judge.solution_1_score}/10</div>
              <p className="reasoning">{data.judge.solution_1_reasoning}</p>
            </div>
          )}
        </div>

        <div className="vs-divider">VS</div>

        <div className={`solution-box ${isS2Winner ? 'winner' : ''}`}>
          <div className="solution-header">
            <h4>Model 2</h4>
            {isS2Winner && data.judge && <Trophy size={18} className="trophy-icon" />}
          </div>
          <div className="solution-content">{data.solution_2}</div>
          {data.judge && (
            <div className="judge-box">
              <div className="score-badge">Score: {data.judge.solution_2_score}/10</div>
              <p className="reasoning">{data.judge.solution_2_reasoning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonBattleCard = () => (
  <div className="battle-card skeleton-card">
    <div className="solutions-container">
      <div className="solution-box skeleton">
        <div className="solution-header shimmering h-10" style={{ borderBottom: 'none' }}></div>
        <div className="solution-content">
           <div className="shimmering h-4 w-full mb-3"></div>
           <div className="shimmering h-4 w-5-6 mb-3"></div>
           <div className="shimmering h-4 w-4-6 mb-3"></div>
           <div className="shimmering h-4 w-full"></div>
        </div>
      </div>
      <div className="vs-divider shimmering" style={{ border: 'none' }}></div>
      <div className="solution-box skeleton">
        <div className="solution-header shimmering h-10" style={{ borderBottom: 'none' }}></div>
        <div className="solution-content">
           <div className="shimmering h-4 w-full mb-3"></div>
           <div className="shimmering h-4 w-11-12 mb-3"></div>
           <div className="shimmering h-4 w-3-4 mb-3"></div>
           <div className="shimmering h-4 w-5-6"></div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: userMsg.content }),
      });

      const data = await response.json();
      
      let aiContent = "";
      let battleData: BattleResult | undefined = undefined;

      if (data.success && data.result) {
        const potentialJSON = extractJSON(typeof data.result === 'string' ? data.result : JSON.stringify(data.result));
        
        // Check if it matches our card structure
        if (potentialJSON && potentialJSON.problem && potentialJSON.solution_1 && potentialJSON.solution_2) {
          battleData = potentialJSON as BattleResult;
          aiContent = "Battle results successfully analyzed!";
        } else {
          aiContent = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
        }
      } else {
        aiContent = data.message || "An error occurred while executing the graph.";
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'agent', content: aiContent, battleData },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'agent', content: "Failed to connect to backend server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container fade-in">
      <header className="header">
        <div className="logo glow-effect" style={{ borderRadius: '50%', padding: '4px' }}>
          <Bot size={32} />
        </div>
        <h1 className="header-title">AI Battle Arena</h1>
      </header>

      <main className="main-content">
        {messages.length === 0 ? (
          <div className="empty-state fade-in">
            <Sparkles size={48} className="empty-state-icon" />
            <h2>Welcome to <span className="hero-gradient-text">Battle Arena</span></h2>
            <p>Enter a prompt below to interact with the AI logic graph.</p>
          </div>
        ) : (
          <div className="chat-history">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message-bubble fade-in ${msg.role === 'user' ? 'message-user' : 'message-ai'} ${msg.battleData ? 'battle-message' : ''}`}
              >
                {msg.battleData ? (
                  <BattleCard data={msg.battleData} />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: msg.role === 'agent' ? 'inherit' : 'inherit' }}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble message-ai fade-in battle-message">
                <SkeletonBattleCard />
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        )}

        <div className="input-section glow-effect" style={{ borderRadius: '16px' }}>
          <textarea
            className="textarea-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here... (Press Enter to send)"
            disabled={isLoading}
          />
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            title="Send Message"
          >
            <Send size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
