from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from src.chat import ChatSystem, ChatSystemError
from src.logger import setup_logger
import time
from typing import Optional

logger = setup_logger("api_server")

app = FastAPI(
    title="AI 문서 기반 채팅 API",
    description="문서를 기반으로 한 질의응답 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 모델
class Query(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)

# 응답 모델
class ChatResponse(BaseModel):
    answer: str
    processing_time: float
    error: Optional[str] = None

# 채팅 시스템 초기화
try:
    logger.info("채팅 시스템 초기화 시작")
    chatbot = ChatSystem()
    logger.info("채팅 시스템 초기화 완료")
except Exception as e:
    logger.error(f"채팅 시스템 초기화 실패: {str(e)}")
    chatbot = None

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(q: Query):
    """채팅 엔드포인트"""
    start_time = time.time()
    
    if not chatbot:
        error_msg = "채팅 시스템이 초기화되지 않았습니다."
        logger.error(error_msg)
        return JSONResponse(
            status_code=500,
            content={
                "answer": "",
                "processing_time": time.time() - start_time,
                "error": error_msg
            }
        )
    
    try:
        logger.info(f"질문 수신: {q.question}")
        answer = chatbot.ask(q.question)
        processing_time = time.time() - start_time
        logger.info(f"답변 생성 완료 (처리 시간: {processing_time:.2f}초)")
        
        return ChatResponse(
            answer=answer,
            processing_time=processing_time
        )
    except ChatSystemError as e:
        error_msg = str(e)
        logger.error(f"채팅 시스템 오류: {error_msg}")
        return JSONResponse(
            status_code=500,
            content={
                "answer": "",
                "processing_time": time.time() - start_time,
                "error": error_msg
            }
        )
    except Exception as e:
        error_msg = f"예상치 못한 오류 발생: {str(e)}"
        logger.error(error_msg)
        return JSONResponse(
            status_code=500,
            content={
                "answer": "",
                "processing_time": time.time() - start_time,
                "error": error_msg
            }
        )

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    try:
        status = {
            "status": "healthy",
            "chat_system_initialized": chatbot is not None
        }
        logger.info("상태 확인 요청")
        return status
    except Exception as e:
        error_msg = f"상태 확인 실패: {str(e)}"
        logger.error(error_msg)
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": error_msg}
        )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """전역 예외 처리"""
    error_msg = f"예상치 못한 오류 발생: {str(exc)}"
    logger.error(error_msg)
    return JSONResponse(
        status_code=500,
        content={"error": error_msg}
    ) 