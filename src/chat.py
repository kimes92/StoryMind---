from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
import os
from src.vector_store import VectorStore, VectorStoreError
from src.data_loader import DataLoader, DataLoaderError
from src.config import OPENAI_API_KEY, LLM_MODEL, VECTOR_STORE_PATH
from src.logger import setup_logger
from typing import Optional

logger = setup_logger("chat_system")

class ChatSystemError(Exception):
    """채팅 시스템 관련 커스텀 예외"""
    pass

class ChatSystem:
    def __init__(self):
        """채팅 시스템을 초기화합니다."""
        try:
            logger.info("채팅 시스템 초기화 시작")
            
            # API 키 검증
            if not OPENAI_API_KEY:
                raise ChatSystemError("OpenAI API 키가 설정되지 않았습니다.")

            # 컴포넌트 초기화
            self.loader = DataLoader()
            self.vs = VectorStore()
            
            # 문서 로드 및 인덱스 구축/로드
            docs = self.loader.load()
            if os.path.exists(VECTOR_STORE_PATH):
                logger.info("기존 인덱스 로드")
                self.index = self.vs.load()
            else:
                if not docs:
                    raise ChatSystemError("문서가 없어 인덱스를 구축할 수 없습니다.")
                logger.info("새 인덱스 구축")
                self.index = self.vs.build(docs)
            
            # QA 체인 설정
            self.chain = RetrievalQA.from_chain_type(
                llm=ChatOpenAI(
                    model_name=LLM_MODEL,
                    openai_api_key=OPENAI_API_KEY,
                    temperature=0.7
                ),
                chain_type="stuff",
                retriever=self.index.as_retriever(
                    search_kwargs={"k": 3}
                )
            )
            logger.info("채팅 시스템 초기화 완료")

        except (DataLoaderError, VectorStoreError) as e:
            error_msg = f"초기화 실패: {str(e)}"
            logger.error(error_msg)
            raise ChatSystemError(error_msg)
        except Exception as e:
            error_msg = f"예상치 못한 오류 발생: {str(e)}"
            logger.error(error_msg)
            raise ChatSystemError(error_msg)

    def ask(self, question: str) -> str:
        """질문에 대한 답변을 생성합니다."""
        if not question or not question.strip():
            error_msg = "질문이 비어있습니다."
            logger.error(error_msg)
            raise ChatSystemError(error_msg)

        try:
            logger.info(f"질문 처리 시작: {question}")
            answer = self.chain.run(question)
            logger.info("답변 생성 완료")
            return answer
        except Exception as e:
            error_msg = f"답변 생성 실패: {str(e)}"
            logger.error(error_msg)
            raise ChatSystemError(error_msg)

    def get_relevant_documents(self, question: str) -> list:
        """질문과 관련된 문서를 검색합니다."""
        try:
            logger.info(f"관련 문서 검색 시작: {question}")
            docs = self.vs.similarity_search(question)
            logger.info(f"검색된 문서 수: {len(docs)}")
            return docs
        except Exception as e:
            error_msg = f"문서 검색 실패: {str(e)}"
            logger.error(error_msg)
            raise ChatSystemError(error_msg) 