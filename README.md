# StoryMind - 인생 스토리 가이드 웹 애플리케이션

## 🌟 프로젝트 소개

StoryMind는 스토리브랜드 7단계를 통해 사용자의 인생 이야기를 체계적으로 정리하고 마인드맵으로 시각화하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- **🎯 스토리브랜드 7단계 가이드**: 체계적인 인생 스토리 작성 도구
- **🧠 마인드맵 생성**: 아이디어와 생각을 시각적으로 정리
- **📊 우선순위 관리**: 개인 센터핀 설정 도구
- **🔐 Google OAuth 로그인**: 안전한 사용자 인증
- **📱 반응형 디자인**: 모든 디바이스에서 최적화된 경험

## 🚀 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: NextAuth.js, Google OAuth
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 💻 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 🌐 배포된 사이트

- **URL**: [https://storyminding.vercel.app](https://storyminding.vercel.app)

## 📝 환경 변수

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
```

## 🎨 주요 페이지

- `/`: 스토리브랜드 가이드 메인 페이지
- `/auth/login`: 로그인 페이지
- `/mindmap`: 마인드맵 생성 및 관리
- `/priority-management`: 우선순위 관리 도구

---

Made with ❤️ by StoryMind Team
