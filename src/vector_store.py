from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
import os
from src.config import OPENAI_API_KEY, VECTOR_STORE_PATH
from src.logger import setup_logger
from typing import List, Optional
from langchain.schema import Document

logger = setup_logger("vector_store")

class VectorStoreError(Exception):
    """벡터 저장소 관련 커스텀 예외"""
    pass

class VectorStore:
    def __init__(self, persist_path: str = VECTOR_STORE_PATH):
        if not OPENAI_API_KEY:
            error_msg = "OpenAI API 키가 설정되지 않았습니다."
            logger.error(error_msg)
            raise VectorStoreError(error_msg)

        self.persist_path = persist_path
        try:
            self.embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
            logger.info("OpenAI 임베딩 모델 초기화 완료")
        except Exception as e:
            error_msg = f"임베딩 모델 초기화 실패: {str(e)}"
            logger.error(error_msg)
            raise VectorStoreError(error_msg)

    def build(self, docs: List[Document]) -> FAISS:
        """문서로부터 FAISS 인덱스를 구축합니다."""
        if not docs:
            error_msg = "문서가 비어있습니다."
            logger.error(error_msg)
            raise VectorStoreError(error_msg)

        try:
            logger.info(f"FAISS 인덱스 구축 시작: {len(docs)} 문서")
            index = FAISS.from_documents(docs, self.embeddings)
            
            # 저장 디렉토리 생성
            os.makedirs(os.path.dirname(self.persist_path), exist_ok=True)
            
            # 인덱스 저장
            index.save_local(self.persist_path)
            logger.info(f"FAISS 인덱스 저장 완료: {self.persist_path}")
            
            return index
        except Exception as e:
            error_msg = f"인덱스 구축 실패: {str(e)}"
            logger.error(error_msg)
            raise VectorStoreError(error_msg)

    def load(self) -> FAISS:
        """저장된 FAISS 인덱스를 로드합니다."""
        if not os.path.exists(self.persist_path):
            error_msg = f"인덱스가 존재하지 않습니다: {self.persist_path}"
            logger.error(error_msg)
            raise VectorStoreError(error_msg)

        try:
            logger.info(f"FAISS 인덱스 로드 시작: {self.persist_path}")
            index = FAISS.load_local(self.persist_path, self.embeddings)
            logger.info("FAISS 인덱스 로드 완료")
            return index
        except Exception as e:
            error_msg = f"인덱스 로드 실패: {str(e)}"
            logger.error(error_msg)
            raise VectorStoreError(error_msg)

    def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        """유사도 검색을 수행합니다."""
        try:
            if not hasattr(self, 'index'):
                error_msg = "인덱스가 초기화되지 않았습니다."
                logger.error(error_msg)
                raise VectorStoreError(error_msg)

            logger.info(f"유사도 검색 시작: {query}")
            results = self.index.similarity_search(query, k=k)
            logger.info(f"검색 결과: {len(results)} 문서")
            return results
        except Exception as e:
            error_msg = f"유사도 검색 실패: {str(e)}"
            logger.error(error_msg)
            raise VectorStoreError(error_msg) 