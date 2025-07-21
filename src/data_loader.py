import os
from langchain.document_loaders import TextLoader, UnstructuredPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from src.config import DATA_DIR, CHUNK_SIZE, CHUNK_OVERLAP

class DataLoader:
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )

    def load(self):
        """데이터 디렉토리에서 문서를 로드하고 청크로 분할합니다."""
        docs = []
        for path in os.listdir(self.data_dir):
            full_path = os.path.join(self.data_dir, path)
            if path.endswith(".txt"):
                loader = TextLoader(full_path)
            elif path.endswith(".pdf"):
                loader = UnstructuredPDFLoader(full_path)
            else:
                continue
            docs += loader.load()
        
        if not docs:
            print("경고: 데이터 디렉토리에 문서가 없습니다.")
            return []
            
        return self.splitter.split_documents(docs) 