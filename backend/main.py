import json
import os

import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Production-Grade Q-Commerce Search API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading local semantic model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
EMBEDDING_DIM = 384
print("Model loaded successfully!")

faiss_index = faiss.IndexFlatIP(EMBEDDING_DIM)

INTENT_TAGS = {
    "thirsty": "drink beverages water juice liquid soda thirsty refreshing",
    "hangover": "headache pain medical pharma disprin crocin sick",
    "tired": "energy caffeine coffee monster stay awake exhaustion",
    "hungry": "food snacks noodles chips cookies eating meal",
}

# Global variable to hold our loaded catalog in memory
CATALOG = []


def load_catalog_from_json():
    """Reads the dataset from the JSON file."""
    if not os.path.exists("catalog.json"):
        raise RuntimeError(
            "catalog.json file not found. Please create it in the root directory."
        )

    with open("catalog.json", "r", encoding="utf-8") as file:
        return json.load(file)


@app.on_event("startup")
def build_vector_index():
    global CATALOG
    print("Loading data from catalog.json...")
    CATALOG = load_catalog_from_json()

    print("Building FAISS index...")
    vectors = []

    for item in CATALOG:
        text_to_embed = f"{item['name']} {item['description']} {item['category']}"

        if item["category"] == "Beverages":
            text_to_embed += " drink thirsty liquid beverage"
        elif item["category"] == "Pharmacy":
            text_to_embed += " medicine pain medical health"
        elif item["category"] == "Snacks":
            text_to_embed += " food hungry crunchy eating meal"

        vector = model.encode(text_to_embed)
        vectors.append(vector)

    vectors_matrix = np.array(vectors).astype("float32")
    faiss_index.add(vectors_matrix)
    print(f"FAISS index successfully built with {faiss_index.ntotal} items!")


@app.get("/search")
def search(query: str, limit: int = 5):
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    clean_query = query.lower().strip()

    for key, tags in INTENT_TAGS.items():
        if key in clean_query:
            clean_query += f" {tags}"

    query_vector = model.encode(clean_query).astype("float32").reshape(1, -1)

    scores, indices = faiss_index.search(query_vector, len(CATALOG))

    scores = scores[0]
    matched_indices = indices[0]

    results = []

    for score, idx in zip(scores, matched_indices):
        if idx == -1:
            continue

        product = CATALOG[idx]

        if product["stock"] <= 0:
            continue

        results.append({"product": product, "score": float(score)})

    if not results:
        return []

    top_score = results[0]["score"]
    if top_score < 0.15:
        return []

    filtered_results = [
        res for res in results if res["score"] >= (top_score * 0.60)
    ]  # Relaxed threshold slightly for a larger dataset

    return filtered_results[:limit]
