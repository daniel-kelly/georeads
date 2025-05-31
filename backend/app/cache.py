# cache.py
from dotenv import load_dotenv
from pymongo import MongoClient
from urllib.parse import quote_plus
import os

load_dotenv()

# --- Step 1: Set up connection ---
# Replace with your MongoDB connection URI (or use an environment variable)
MONGO_URI = os.environ.get("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client.georeads  # Database name
collection = db.authors  # Collection name (like a table)

# --- Step 2: Retrieve from cache ---
def get_cached_nationality(author_name: str):
    doc = collection.find_one({"name": author_name})
    if doc:
        return doc["nationality"]
    return None

# --- Step 3: Save to cache ---
def cache_nationality(author_name: str, nationality: str):
    if nationality.lower() != "unknown":
        collection.update_one(
            {"name": author_name},
            {"$set": {"nationality": nationality}},
            upsert=True
        )