from pathlib import Path
from flask import Flask, jsonify, render_template, request
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "movies.csv"

app = Flask(__name__)

def load_movies():
    """Load the local movie catalogue and prepare searchable text features."""
    df = pd.read_csv(DATA_PATH).fillna("")
    for column in ("genres", "overview", "year", "rating", "poster", "title"):
        if column not in df.columns:
            df[column] = ""
    df["id"] = df["id"].astype(int)
    df["features"] = (
        df["genres"].astype(str).str.replace("|", " ", regex=False) + " " +
        df["overview"].astype(str)
    )
    return df

movies = load_movies()
vectorizer = TfidfVectorizer(stop_words="english")
feature_matrix = vectorizer.fit_transform(movies["features"])
similarity = cosine_similarity(feature_matrix)

def movie_dict(row):
    return {
        "id": int(row["id"]),
        "title": str(row["title"]),
        "year": str(row["year"]),
        "genres": [g for g in str(row["genres"]).split("|") if g],
        "overview": str(row["overview"]),
        "rating": float(row["rating"]) if str(row["rating"]).strip() else None,
        "poster": str(row["poster"])
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/movies")
def get_movies():
    genre = request.args.get("genre", "").strip().lower()
    query = request.args.get("q", "").strip().lower()
    selected = movies
    if genre and genre != "all":
        selected = selected[selected["genres"].str.lower().str.contains(genre, regex=False)]
    if query:
        selected = selected[selected["title"].str.lower().str.contains(query, regex=False)]
    return jsonify([movie_dict(row) for _, row in selected.iterrows()])

@app.get("/api/genres")
def get_genres():
    genres = sorted({
        genre.strip()
        for values in movies["genres"].astype(str)
        for genre in values.split("|")
        if genre.strip()
    })
    return jsonify(genres)

@app.get("/api/recommend/<int:movie_id>")
def recommend(movie_id):
    matches = movies.index[movies["id"] == movie_id].tolist()
    if not matches:
        return jsonify({"error": "Movie not found"}), 404
    index = matches[0]
    limit = request.args.get("limit", default=6, type=int)
    limit = max(1, min(limit or 6, 12))
    ranked = sorted(enumerate(similarity[index]), key=lambda item: item[1], reverse=True)
    recommendations = []
    for other_index, score in ranked:
        if other_index == index:
            continue
        item = movie_dict(movies.iloc[other_index])
        item["similarity"] = round(float(score), 3)
        recommendations.append(item)
        if len(recommendations) >= limit:
            break
    return jsonify({
        "based_on": movie_dict(movies.iloc[index]),
        "recommendations": recommendations
    })

@app.get("/api/search")
def search():
    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify([])
    selected = movies[movies["title"].str.lower().str.contains(query, regex=False)]
    return jsonify([movie_dict(row) for _, row in selected.head(10).iterrows()])

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
