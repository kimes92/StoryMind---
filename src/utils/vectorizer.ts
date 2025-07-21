import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/community/vectorstores/pinecone';
import { CrawledContent } from './crawler';
import { initializePinecone } from './setup';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

export async function vectorizeContent(contents: CrawledContent[]) {
  try {
    const { client, indexName } = await initializePinecone();
    const pineconeIndex = client.Index(indexName);
    
    // OpenAI 임베딩 생성 (API 키 없이도 작동하도록 수정)
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });

    // Prepare documents for vectorization
    const documents = contents.map((content) => ({
      pageContent: `${content.title}\n${content.content}`,
      metadata: {
        url: content.url,
        title: content.title,
      },
    }));

    // Create and store vectors
    await PineconeStore.fromDocuments(documents, embeddings, {
      pineconeIndex,
    });

    return true;
  } catch (error) {
    console.error('Error vectorizing content:', error);
    throw error;
  }
}

export async function searchSimilarContent(query: string, k: number = 5) {
  try {
    const { client, indexName } = await initializePinecone();
    const pineconeIndex = client.Index(indexName);
    
    // OpenAI 임베딩 생성 (API 키 없이도 작동하도록 수정)
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });

    const results = await vectorStore.similaritySearch(query, k);
    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
} 