# CineMatch — Movie Recommendation System

A beginner-friendly full-stack movie recommendation mini-project built with **Python, Flask, Pandas, scikit-learn, HTML, CSS and JavaScript**.

## Features
- Responsive frontend for desktop and mobile
- Browse a local sample catalogue of movies
- Search movies by title
- Filter by genre
- Select a movie to get six similar recommendations
- Content-based recommendation using TF-IDF and cosine similarity
- Flask REST API backend
- No API key or external database required

## Project structure
```
movie_recommendation_system/
├── app.py
├── requirements.txt
├── README.md
├── data/
│   └── movies.csv
├── templates/
│   └── index.html
└── static/
    ├── app.js
    └── style.css
```

## Requirements
- Python 3.9 or later
- pip

## Run locally

1. Extract the ZIP file and open a terminal in the project folder.
2. (Optional but recommended) Create and activate a virtual environment:
   - Windows: `python -m venv .venv` then `.venv\\Scripts\\activate`
   - macOS/Linux: `python3 -m venv .venv` then `source .venv/bin/activate`
3. Install packages:
   ```
   pip install -r requirements.txt
   ```
4. Start the backend:
   ```
   python app.py
   ```
5. Open this address in your browser:
   `http://127.0.0.1:5000`

Do not open `index.html` directly from the file manager. The frontend uses Flask API routes, so run the Flask server first.

## API endpoints
- `GET /api/movies` — list all movies
- `GET /api/movies?genre=Sci-Fi` — filter by genre
- `GET /api/movies?q=matrix` — search titles
- `GET /api/genres` — list genres
- `GET /api/recommend/1?limit=6` — recommend movies similar to movie ID 1
- `GET /api/search?q=dark` — search title matches

## How recommendation works
1. The backend combines each movie's genres and overview into a text feature.
2. `TfidfVectorizer` converts these text features into numerical vectors.
3. Cosine similarity measures how closely the movie vectors match.
4. The backend returns the closest matching titles, excluding the selected movie.

This is a small educational content-based recommender using a hand-prepared sample dataset. Similarity scores are not audience ratings and recommendations are limited by the sample catalogue.

## Project report note
Describe only the work you actually run, test and understand. Add your own screenshots of the running interface and API responses. The included dataset is illustrative sample data, not a live movie database.
