'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Target, CheckCircle, AlertCircle, Lightbulb, Heart, Star, Plus, X, Check, Bell, Zap, Info } from 'lucide-react';
import HamburgerMenu from '../../components/HamburgerMenu';

const CenterPinApp = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('morning');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // 3-1-3 시스템 데이터
  const [morningData, setMorningData] = useState({
    gratitude: ['', '', ''], // 감사 3개
    centerPin: '', // 오늘의 센터핀 1개
    actions: ['', '', ''] // 행동 다짐 3개
  });
  
  const [lunchData, setLunchData] = useState({
    progress: 50, // 센터핀 진행률 (0-100%)
    afternoonFocus: '', // 오후 집중포인트 1개
    energyLevel: 5 // 에너지 레벨 (1-10)
  });
  
  const [eveningData, setEveningData] = useState({
    achievements: ['', '', ''], // 성취한 것 3개
    tomorrowCenterPin: '', // 내일의 센터핀 1개
    improvements: ['', '', ''] // 개선점 3개
  });

  const [isCreatingCalendarEvents, setIsCreatingCalendarEvents] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState('');
  const [streakCount, setStreakCount] = useState(0);

  // 인증 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
  }, [session, status, router]);

  // LocalStorage에서 데이터 로드
  useEffect(() => {
    if (session?.user?.email) {
      loadDataFromStorage();
      calculateStreak();
    }
  }, [session]);

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // LocalStorage 키 생성
  const getStorageKey = (type: string) => {
    return `centerPin_${session?.user?.email}_${type}`;
  };

  // 데이터 로드
  const loadDataFromStorage = () => {
    try {
      const savedMorningData = localStorage.getItem(getStorageKey('morning'));
      const savedLunchData = localStorage.getItem(getStorageKey('lunch'));
      const savedEveningData = localStorage.getItem(getStorageKey('evening'));

      if (savedMorningData) setMorningData(JSON.parse(savedMorningData));
      if (savedLunchData) setLunchData(JSON.parse(savedLunchData));
      if (savedEveningData) setEveningData(JSON.parse(savedEveningData));
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  // 스트릭 계산
  const calculateStreak = () => {
    try {
      const streakData = localStorage.getItem(getStorageKey('streak'));
      if (streakData) {
        const { count, lastDate } = JSON.parse(streakData);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        if (lastDate === today) {
          setStreakCount(count);
        } else if (lastDate === yesterday) {
          setStreakCount(count);
        } else {
          setStreakCount(0);
        }
      }
    } catch (error) {
      console.error('스트릭 계산 오류:', error);
    }
  };

  // 데이터 저장
  const saveDataToStorage = (type: string, data: any) => {
    try {
      localStorage.setItem(getStorageKey(type), JSON.stringify(data));
      
      // 스트릭 업데이트
      const today = new Date().toDateString();
      const streakData = {
        count: streakCount + 1,
        lastDate: today
      };
      localStorage.setItem(getStorageKey('streak'), JSON.stringify(streakData));
      setStreakCount(streakCount + 1);
    } catch (error) {
      console.error('데이터 저장 오류:', error);
    }
  };

  // 구글 캘린더 일정 생성
  const createCalendarEvents = async () => {
    if (!morningData.centerPin.trim()) {
      setCalendarStatus('❌ 먼저 오늘의 센터핀을 설정해주세요!');
      setTimeout(() => setCalendarStatus(''), 3000);
      return;
    }

    setIsCreatingCalendarEvents(true);
    setCalendarStatus('🔄 센터핀 알림을 구글 캘린더에 생성하고 있습니다...');

    try {
      const response = await fetch('/api/priority-management/calendar-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centerPin: morningData.centerPin,
          userEmail: session?.user?.email
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.isDemo) {
          setCalendarStatus(`📝 ${result.message}`);
        } else {
          setCalendarStatus(`✅ ${result.message}`);
        }
      } else if (result.needReauth) {
        setCalendarStatus('🔄 구글 계정 재인증이 필요합니다...');
        // 3초 후 자동으로 재로그인 페이지로 이동
        setTimeout(() => {
          window.location.href = '/api/auth/signin/google?callbackUrl=' + encodeURIComponent(window.location.pathname);
        }, 3000);
      } else {
        throw new Error(result.error || '캘린더 동기화 실패');
      }
    } catch (error) {
      console.error('캘린더 동기화 오류:', error);
      setCalendarStatus('❌ 구글 캘린더 연동을 위해서는 환경변수 설정과 Google Cloud Console 설정이 필요합니다.');
    } finally {
      setIsCreatingCalendarEvents(false);
      setTimeout(() => setCalendarStatus(''), 8000);
    }
  };

  const updateMorningData = (field: string, index: number | null, value: string) => {
    const updated = { ...morningData };
    if (field === 'centerPin') {
      updated.centerPin = value;
    } else if (index !== null) {
      (updated[field as keyof typeof morningData] as string[])[index] = value;
    }
    setMorningData(updated);
    saveDataToStorage('morning', updated);
  };

  const updateLunchData = (field: string, value: string | number) => {
    const updated = { ...lunchData, [field]: value };
    setLunchData(updated);
    saveDataToStorage('lunch', updated);
  };

  const updateEveningData = (field: string, index: number | null, value: string) => {
    const updated = { ...eveningData };
    if (field === 'tomorrowCenterPin') {
      updated.tomorrowCenterPin = value;
    } else if (index !== null) {
      (updated[field as keyof typeof eveningData] as string[])[index] = value;
    }
    setEveningData(updated);
    saveDataToStorage('evening', updated);
  };

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: '좋은 아침입니다! 🌅', color: 'text-orange-600' };
    if (hour < 18) return { text: '좋은 오후입니다! ☀️', color: 'text-blue-600' };
    return { text: '좋은 저녁입니다! 🌙', color: 'text-purple-600' };
  };

  const greeting = getTimeBasedGreeting();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerMenu />
      
      <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl font-bold text-gray-800">나만의 센터핀</h1>
            <button
              onClick={() => setShowInfoModal(true)}
              className="ml-3 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Info className="w-6 h-6" />
            </button>
          </div>
          <p className={`text-xl ${greeting.color} font-medium`}>{greeting.text}</p>
          <p className="text-gray-600 mt-2">
            {currentTime.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })} {currentTime.toLocaleTimeString('ko-KR')}
          </p>
          
          {/* 스트릭 카운터 */}
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">연속 실행</div>
              <div className="text-2xl font-bold text-blue-600">{streakCount}일</div>
            </div>
            {morningData.centerPin && (
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">센터핀 진행률</div>
                <div className="text-2xl font-bold text-green-600">{lunchData.progress}%</div>
              </div>
            )}
          </div>

          {/* 간단한 사용법 */}
          <div className="mt-6 bg-white/70 rounded-lg p-4 text-sm text-gray-700">
            <strong>3-1-3 시스템:</strong> 아침(감사3개+센터핀1개+행동3개) → 점심(진행률체크) → 저녁(성취3개+내일센터핀1개+개선3개)
          </div>
          
          {/* 구글 캘린더 연동 버튼 */}
          <div className="mt-4">
            <button
              onClick={createCalendarEvents}
              disabled={isCreatingCalendarEvents}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
            >
              <Zap className="w-5 h-5" />
              <span>
                {isCreatingCalendarEvents ? '동기화 중...' : '구글 캘린더 알림 생성'}
              </span>
            </button>
            {calendarStatus && (
              <p className="mt-2 text-sm text-gray-700">{calendarStatus}</p>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('morning')}
              className={`px-6 py-3 rounded-md transition-all ${
                activeTab === 'morning' 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="inline mr-2" size={20} />
              아침 설정 (7분)
            </button>
            <button
              onClick={() => setActiveTab('lunch')}
              className={`px-6 py-3 rounded-md transition-all ${
                activeTab === 'lunch' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Target className="inline mr-2" size={20} />
              점심 체크 (3분)
            </button>
            <button
              onClick={() => setActiveTab('evening')}
              className={`px-6 py-3 rounded-md transition-all ${
                activeTab === 'evening' 
                  ? 'bg-purple-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Star className="inline mr-2" size={20} />
              저녁 회고 (5분)
            </button>
          </div>
        </div>

        {/* 아침 설정 */}
        {activeTab === 'morning' && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-orange-600 mb-6 flex items-center">
              <Heart className="mr-3" size={28} />
              아침 센터핀 설정 (7분)
            </h2>
            
            <div className="space-y-8">
              {/* 감사 3개 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Heart className="mr-2 text-red-500" size={20} />
                  감사한 것 3가지
                </h3>
                {morningData.gratitude.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => updateMorningData('gratitude', index, e.target.value)}
                    placeholder={`감사한 것 ${index + 1}`}
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                ))}
              </div>

              {/* 센터핀 1개 - 강조 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Target className="mr-2 text-blue-600" size={20} />
                  🎯 오늘의 센터핀 (가장 중요한 1가지)
                </h3>
                <input
                  type="text"
                  value={morningData.centerPin}
                  onChange={(e) => updateMorningData('centerPin', null, e.target.value)}
                  placeholder="오늘 반드시 달성해야 할 가장 중요한 일"
                  className="w-full p-4 text-lg border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                />
              </div>

              {/* 행동 다짐 3개 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Lightbulb className="mr-2 text-yellow-500" size={20} />
                  구체적 행동 계획 3가지
                </h3>
                {morningData.actions.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => updateMorningData('actions', index, e.target.value)}
                    placeholder={`구체적 행동 ${index + 1}`}
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 점심 체크 */}
        {activeTab === 'lunch' && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
              <Target className="mr-3" size={28} />
              점심 중간 체크 (3분)
            </h2>
            
            <div className="space-y-8">
              {/* 센터핀 표시 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm text-blue-600 font-medium mb-2">오늘의 센터핀</h3>
                <p className="text-lg font-semibold text-gray-800">{morningData.centerPin || '아직 설정되지 않았습니다'}</p>
              </div>

              {/* 진행률 슬라이더 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-green-500" size={20} />
                  센터핀 진행률: {lunchData.progress}%
                </h3>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lunchData.progress}
                  onChange={(e) => updateLunchData('progress', parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>시작 안함</span>
                  <span>진행 중</span>
                  <span>완료!</span>
                </div>
              </div>

              {/* 오후 집중포인트 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Lightbulb className="mr-2 text-yellow-500" size={20} />
                  오후 집중포인트 (1가지만)
                </h3>
                <input
                  type="text"
                  value={lunchData.afternoonFocus}
                  onChange={(e) => updateLunchData('afternoonFocus', e.target.value)}
                  placeholder="오후에 가장 집중할 일"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 에너지 레벨 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Star className="mr-2 text-purple-500" size={20} />
                  현재 에너지 레벨: {lunchData.energyLevel}/10
                </h3>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lunchData.energyLevel}
                  onChange={(e) => updateLunchData('energyLevel', parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>매우 낮음</span>
                  <span>보통</span>
                  <span>매우 높음</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 저녁 회고 */}
        {activeTab === 'evening' && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-6 flex items-center">
              <Star className="mr-3" size={28} />
              저녁 회고 (5분)
            </h2>
            
            <div className="space-y-8">
              {/* 성취한 것 3개 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-green-500" size={20} />
                  오늘 성취한 것 3가지
                </h3>
                {eveningData.achievements.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => updateEveningData('achievements', index, e.target.value)}
                    placeholder={`성취한 것 ${index + 1}`}
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ))}
              </div>

              {/* 내일의 센터핀 - 강조 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Target className="mr-2 text-purple-600" size={20} />
                  🎯 내일의 센터핀
                </h3>
                <input
                  type="text"
                  value={eveningData.tomorrowCenterPin}
                  onChange={(e) => updateEveningData('tomorrowCenterPin', null, e.target.value)}
                  placeholder="내일 가장 중요한 일을 미리 정하세요"
                  className="w-full p-4 text-lg border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                />
              </div>

              {/* 개선점 3개 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Lightbulb className="mr-2 text-yellow-500" size={20} />
                  개선할 점 3가지
                </h3>
                {eveningData.improvements.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => updateEveningData('improvements', index, e.target.value)}
                    placeholder={`개선점 ${index + 1}`}
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 하단 알림 시간 안내 */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
          <h3 className="text-xl font-bold mb-3 flex items-center">
            <Clock className="mr-2" size={24} />
            3-1-3 시스템 알림 시간
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <strong>아침 06:30</strong><br />
              센터핀 설정 (7분)
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <strong>점심 12:30</strong><br />
              진행률 체크 (3분)
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <strong>저녁 21:00</strong><br />
              하루 회고 (5분)
            </div>
          </div>
        </div>

        {/* 정보 모달 */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowInfoModal(false)}>
            <div className="bg-white rounded-xl p-8 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">왜 센터핀이 필요할까요?</h2>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-3">📚 5권의 성공 도서 핵심 압축</h3>
                  <p className="leading-relaxed">
                    타이탄의 도구들, 비상식적 성공법칙, 조인트사고, 무기가 되는 스토리, 아이젠하워 매트릭스의 
                    핵심 원리를 하나로 통합한 <strong>3-1-3 시스템</strong>입니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-3">🎯 센터핀의 힘</h3>
                  <p className="leading-relaxed mb-3">
                    조인트사고에서 말하는 <strong>'센터핀 원리'</strong>: 볼링에서 센터핀(1번)만 제대로 맞히면 
                    나머지 핀들이 함께 쓰러지듯, 하루에 가장 중요한 일 하나에만 집중하면 놀라운 결과를 만들 수 있습니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-orange-600 mb-3">⚡ 무엇을 느끼게 될까요?</h3>
                  <ul className="space-y-2">
                    <li>• <strong>명확함</strong>: 매일 가장 중요한 일이 무엇인지 명확해집니다</li>
                    <li>• <strong>집중력</strong>: 여러 일에 분산되지 않고 핵심에 집중하게 됩니다</li>
                    <li>• <strong>성취감</strong>: 작은 것이라도 매일 완료하는 뿌듯함을 느낍니다</li>
                    <li>• <strong>감사함</strong>: 매일 감사 3가지를 통해 긍정적 에너지를 얻습니다</li>
                    <li>• <strong>성장감</strong>: 매일 개선점을 찾아 지속적으로 발전합니다</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-purple-600 mb-3">🚀 무엇이 향상될까요?</h3>
                  <ul className="space-y-2">
                    <li>• <strong>생산성</strong>: 중요한 일에만 집중해 효율이 극대화됩니다</li>
                    <li>• <strong>의사결정력</strong>: 우선순위가 명확해져 빠른 판단이 가능합니다</li>
                    <li>• <strong>스트레스 감소</strong>: 해야 할 일이 명확해져 불안감이 줄어듭니다</li>
                    <li>• <strong>자신감</strong>: 매일 성취를 통해 자신감이 쌓입니다</li>
                    <li>• <strong>지속가능성</strong>: 간단한 시스템으로 오래 지속할 수 있습니다</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-800">
                    💡 <strong>핵심 원리:</strong> 복잡한 계획보다는 <strong>매일 반복되는 간단한 습관</strong>이 
                    인생을 바꿉니다. 하루 15분, 90일만 지속해보세요!
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  시작하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterPinApp; 