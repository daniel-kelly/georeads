# from nationality import get_nationality
#
# if __name__ == "__main__":
#     while True:
#         name = input("Enter an author name (or 'q' to quit): ").strip()
#         if name.lower() == 'q':
#             break
#         nationality = get_nationality(name)
#         print(f"{name} → {nationality}")


from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file into os.environ

MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set. Please add it to your .env file or system environment.")

print("MONGO_URI found, connection can proceed.")

client = MongoClient(os.environ.get("MONGO_URI"))
db = client.georeads
collection = db.authors

for doc in collection.find():
    print(doc)