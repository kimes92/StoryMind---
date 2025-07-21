import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'storymind-index';

export async function initializePinecone() {
  if (!PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
  }

  const client = new Pinecone({
    apiKey: PINECONE_API_KEY,
  });

  return {
    client,
    indexName: PINECONE_INDEX_NAME
  };
}
