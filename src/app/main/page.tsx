'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { auth, db } from '@/app/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
}

interface ChatMeta {
  id: string;
  createdAt: any;
}

interface LoginInfo {
  loginUrl: string;
  username: string;
  password: string;
}

// OpenAI API 호출 함수
async function generateAIResponse(question: string): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: question })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '죄송합니다. 응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('OpenAI API 호출 실패:', error);
    
    // 폴백 응답들
    const fallbackResponses = [
      `"${question}"에 대한 질문을 주셨네요! 

현재 API 연결에 문제가 있어서 간단한 응답만 드릴 수 있습니다. 성경과 신앙에 관한 질문이시라면 🤖 **MCP 개인 비서**에서 더 자세한 답변을 받아보실 수 있습니다.

하나님의 지혜가 함께하시길 기도합니다! 🙏✨`,
      
      `죄송합니다. 현재 시스템에 일시적인 문제가 있습니다.

하지만 "${question}"에 대해 함께 생각해보고 싶습니다. "여호와를 경외하는 것이 지혜의 근본이요" (잠언 9:10) - 모든 지혜는 하나님으로부터 옵니다.

왼쪽 메뉴의 🤖 **MCP 개인 비서**에서 더 정확한 답변을 받아보세요! 📖`,
      
      `기술적 문제로 완전한 답변을 드리지 못해 죄송합니다. 

"${question}"... 정말 좋은 질문이네요! 성경과 신앙에 관한 더 깊이 있는 대화를 원하시면 MCP 개인 비서를 이용해보시기 바랍니다.

주님의 평안이 함께하시길 바랍니다! 🌟`
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

// Header component
function ChatHeader({ profilePic, onMenuClick }: { profilePic: string; onMenuClick: () => void }) {
  const router = useRouter();
  
  return (
    <div
      className={
        'bg-blue-600 text-white shadow-lg rounded-lg flex items-center justify-between px-4 py-3 relative'
      }
      style={{ transform: 'translateY(2%)' }}
    >
      {/* Hamburger */}
      <div className="flex items-center">
        <button
          className="focus:outline-none z-20 shadow-lg bg-white rounded-full p-2"
          onClick={onMenuClick}
          aria-label="Open menu"
          style={{ zIndex: 20 }}
        >
          {/* Three horizontal lines icon */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="5" width="28" height="3" rx="1.5" fill="#2563eb" />
            <rect y="12.5" width="28" height="3" rx="1.5" fill="#2563eb" />
            <rect y="20" width="28" height="3" rx="1.5" fill="#2563eb" />
          </svg>
        </button>
      </div>
      {/* Title */}
      <div className="flex-1 flex justify-center">
        <h1
          className="text-2xl font-bold text-black text-center"
          style={{ textShadow: '0 2px 8px rgba(0,80,200,0.25), 0 1px 0 #fff' }}
        >
          바이블릭
        </h1>
      </div>
      {/* Navigation & Profile */}
      <div className="flex items-center justify-end space-x-2" style={{ minWidth: 120 }}>
        <button
          onClick={() => router.push('/')}
          className="bg-white text-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          title="스토리브랜드 가이드"
        >
          📖 가이드
        </button>
        <div className="flex items-center justify-end" style={{ minWidth: 48 }}>
          {profilePic && (
            <img
              src={profilePic}
              alt="프로필"
              style={{ width: 40, height: 40, boxShadow: '0 0 0 3px #3b82f6, 0 2px 8px rgba(59,130,246,0.18)' }}
              className="rounded-full border-2 border-white shadow"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function MainChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [showChatList, setShowChatList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loginInfo, setLoginInfo] = useState<LoginInfo>({
    loginUrl: '',
    username: '',
    password: ''
  });
  const [urls, setUrls] = useState<string>('');
  const [result, setResult] = useState<string>('');

  // NextAuth 세션 추가
  const { data: session, status } = useSession();

  // NextAuth 인증 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
  }, [session, status, router]);

  // Auth & user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      setProfilePic(user.photoURL || "");
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch chat list
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      const chatCol = collection(db, 'chats', user.uid, 'userChats');
      const q = query(chatCol, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const chatList: ChatMeta[] = [];
      snap.forEach((doc) => {
        chatList.push({ id: doc.id, createdAt: doc.data().createdAt });
      });
      setChats(chatList);
      // Load latest chat by default
      if (chatList.length > 0) {
        loadChat(chatList[0].id);
      } else {
        handleNewChat();
      }
    };
    fetchChats();
    // eslint-disable-next-line
  }, [user]);

  // Load chat messages
  const loadChat = async (chatId: string) => {
    if (!user) return;
    setCurrentChatId(chatId);
    const msgCol = collection(db, 'chats', user.uid, 'userChats', chatId, 'messages');
    const q = query(msgCol, orderBy('timestamp'));
    const snap = await getDocs(q);
    const msgs: Message[] = [];
    snap.forEach((doc) => {
      msgs.push(doc.data() as Message);
    });
    setMessages(msgs);
  };

  // New chat
  const handleNewChat = async () => {
    if (!user) return;
    const chatCol = collection(db, 'chats', user.uid, 'userChats');
    const newChat = await addDoc(chatCol, { createdAt: serverTimestamp() });
    setCurrentChatId(newChat.id);
    setMessages([]);
    setChats((prev) => [
      { id: newChat.id, createdAt: new Date() },
      ...prev,
    ]);
  };

  // Send message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !user || !currentChatId) {
      setResult('⚠️ 메시지를 입력하세요.');
      return;
    }

    setIsLoading(true);
    setResult('');
    const userQuestion = input; // 사용자 질문 저장

    try {
      // 1. 사용자 메시지 저장
      const userMessage: Message = {
        role: 'user',
        content: input,
        timestamp: serverTimestamp()
      };

      const msgCol = collection(db, 'chats', user.uid, 'userChats', currentChatId, 'messages');
      await addDoc(msgCol, userMessage);
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // 2. OpenAI API 호출로 AI 응답 생성
      const aiResponse = await generateAIResponse(userQuestion);

      // 3. AI 응답 저장
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: serverTimestamp()
      };

      await addDoc(msgCol, assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      setResult('✅ 메시지가 전송되었습니다.');

    } catch (error: any) {
      console.error('Error:', error);
      
      // 오류 발생시에도 기본 응답 제공
      const errorResponse: Message = {
        role: 'assistant',
        content: `죄송합니다. 메시지 처리 중 오류가 발생했습니다. 

하지만 저는 여전히 여러분과 함께 성경과 신앙에 대해 이야기하고 싶습니다. 🙏

다시 질문해주시거나, 왼쪽 메뉴의 🤖 **MCP 개인 비서**를 이용해보세요!`,
        timestamp: serverTimestamp()
      };
      
      try {
        const msgCol = collection(db, 'chats', user.uid, 'userChats', currentChatId, 'messages');
        await addDoc(msgCol, errorResponse);
        setMessages(prev => [...prev, errorResponse]);
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
      
      setResult(`⚠️ 오류가 발생했지만 기본 응답을 제공했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Blue/white theme classes
  const headerClass = 'bg-blue-600 text-white shadow-sm';
  const chatBubbleUser = 'bg-white text-black border border-gray-200';
  const chatBubbleAI = 'bg-white text-black border border-gray-200';
  const sendBtnClass = 'bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed';
  const inputClass = 'flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600';

  return (
    <main className="min-h-screen bg-blue-50 flex flex-col px-4 md:px-16 lg:px-32">
      {/* Header (grouped) */}
      <ChatHeader profilePic={profilePic} onMenuClick={() => setShowChatList(true)} />

      {/* Chat List Modal (slide-in from left, overlay) */}
      {showChatList && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black z-40"
            style={{ opacity: 0.2 }}
            onClick={() => setShowChatList(false)}
          />
          {/* Slide-in menu */}
          <div
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-lg p-6 flex flex-col rounded-r-lg z-50 animate-slideInLeft"
            style={{ minHeight: '100vh' }}
          >
            <h2 className="text-xl font-bold mb-4 text-blue-700">채팅 메뉴</h2>
            <button
              className="mb-4 text-blue-600 hover:underline text-left font-semibold"
              onClick={() => {
                handleNewChat();
                setShowChatList(false);
              }}
            >
              + New Chat
            </button>
{/* MCP Assistant 임시 비활성화 - Firebase 의존성으로 인해 */}
            {/* <button
              className="mb-4 text-green-600 hover:underline text-left font-semibold"
              onClick={() => {
                router.push('/mcp-assistant');
                setShowChatList(false);
              }}
            >
              🤖 MCP 개인 비서
            </button> */}
            <div className="mb-2 text-blue-700 font-semibold">View Existing Conversations</div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {chats.length === 0 && <div className="text-gray-400">채팅이 없습니다.</div>}
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-blue-50 ${
                    chat.id === currentChatId ? 'bg-blue-100 font-bold' : ''
                  }`}
                  onClick={() => {
                    loadChat(chat.id);
                    setShowChatList(false);
                  }}
                >
                  {chat.id.slice(0, 8)}... <span className="text-xs text-gray-400">{chat.createdAt?.toDate?.().toLocaleString?.() || ''}</span>
                </button>
              ))}
            </div>
            <button
              className="mt-6 text-gray-400 hover:text-blue-600"
              onClick={() => setShowChatList(false)}
            >
              닫기
            </button>
          </div>
        </>
      )}

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 shadow ${
                  message.role === 'user' ? chatBubbleUser : chatBubbleAI
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp?.toDate?.() ? message.timestamp.toDate().toLocaleTimeString() : new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white shadow rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className={inputClass}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={sendBtnClass}
          >
            전송
          </button>
        </form>
      </div>
    </main>
  );
}

/* Add this to your global CSS (e.g., globals.css):
@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.animate-slideInLeft {
  animation: slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1) forwards;
}
*/
