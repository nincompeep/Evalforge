import os
from typing import List, Dict, Any, Optional
from app.config import settings

class RAGPipeline:
    def __init__(self, collection_name: str = "evalforge_default"):
        self.collection_name = collection_name
        self.persist_directory = settings.CHROMA_PERSIST_DIR
        self._init_store()

    def _init_store(self):
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings

            self.client = chromadb.PersistentClient(path=self.persist_directory)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "EvalForge RAG Evaluation Sandbox"}
            )
            self.available = True
        except Exception as e:
            # Fallback memory store if chromadb is not yet initialized
            self.available = False
            self.memory_docs: List[Dict[str, Any]] = []

    def add_documents(self, documents: List[str], metadatas: Optional[List[Dict[str, Any]]] = None, ids: Optional[List[str]] = None):
        if not ids:
            import uuid
            ids = [str(uuid.uuid4()) for _ in documents]
        if not metadatas:
            metadatas = [{} for _ in documents]

        if self.available:
            self.collection.upsert(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
        else:
            for doc, meta, doc_id in zip(documents, metadatas, ids):
                self.memory_docs.append({"id": doc_id, "text": doc, "metadata": meta})

    def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        if self.available:
            try:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=top_k
                )
                docs = results.get("documents", [[]])
                if docs and len(docs) > 0:
                    return docs[0]
                return []
            except Exception:
                pass

        # Fallback simple retrieval based on word overlap
        query_words = set(query.lower().split())
        scored = []
        for doc in getattr(self, "memory_docs", []):
            text = doc["text"]
            overlap = len(query_words.intersection(set(text.lower().split())))
            scored.append((overlap, text))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [text for _, text in scored[:top_k]]
