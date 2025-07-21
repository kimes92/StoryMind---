import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# OpenAI API 설정
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = "text-embedding-ada-002"
LLM_MODEL = "gpt-3.5-turbo"

# 벡터 저장소 경로
VECTOR_STORE_PATH = "./embeddings/faiss_index"

# 데이터 디렉토리
DATA_DIR = "./data"

# 청크 설정
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100 