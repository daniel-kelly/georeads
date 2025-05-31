# aggregation.py
from pymongo import MongoClient
from dotenv import load_dotenv
import os, pycountry

load_dotenv()
client = MongoClient(os.environ["MONGO_URI"])
db = client.georeads
collection = db.authors

def country_to_iso3(name):
    try:
        return pycountry.countries.lookup(name).alpha_3
    except LookupError:
        return None

def get_nationality_counts():
    raw_counts = collection.aggregate([
        {"$group": {"_id": "$nationality", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ])
    iso_counts = {}
    for doc in raw_counts:
        iso = country_to_iso3(doc["_id"])
        if iso:
            iso_counts[iso] = doc["count"]
    return iso_counts
