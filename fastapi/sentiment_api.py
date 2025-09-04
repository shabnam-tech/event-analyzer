import os
import re
import tempfile
from uuid import uuid4
from io import BytesIO
from datetime import datetime
from fastapi.responses import JSONResponse
import pandas as pd
import joblib
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from matplotlib import pyplot as plt
from fpdf import FPDF
from textblob import TextBlob
import nltk
from pymongo import MongoClient
from fastapi.encoders import jsonable_encoder

# ===============================
# Setup
# ===============================
nltk.download("words")
from nltk.corpus import words as nltk_words  # noqa

english_vocab = set(nltk_words.words())

app = FastAPI()

# CORS for React
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "tanglish_model.pkl")
vectorizer_path = os.path.join(BASE_DIR, "tanglish_vectorizer.pkl")

# Absolute reports dir (…/fastapi/reports)
reports_dir = r"E:\Ffest 25\event-analyser\fastapi\reports"
os.makedirs(reports_dir, exist_ok=True)

# Serve reports as static files at /reports/**
app.mount("/reports", StaticFiles(directory=reports_dir), name="reports")

# Load model + vectorizer
model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017/")
db = client["event_feedback"]
reports_collection = db["reports"]

# ===============================
# Utils
# ===============================
def is_english_text(text, threshold: float = 0.7) -> bool:
    tokens = text.split()
    if not tokens:
        return False
    english_count = sum(1 for w in tokens if w.lower() in english_vocab)
    return (english_count / len(tokens)) >= threshold


def classify_sentiment(text):
    if is_english_text(text):
        polarity = TextBlob(text).sentiment.polarity
        if polarity > 0.1:
            return "Positive", "English"
        elif polarity < -0.1:
            return "Negative", "English"
        else:
            return "Neutral", "English"
    else:
        vec = vectorizer.transform([text])
        pred = model.predict(vec)[0]
        return pred, "Tanglish"


def sanitize_filename(name: str) -> str:
    # keep letters, numbers, dash, underscore, space; squish spaces to underscores
    safe = re.sub(r"[^A-Za-z0-9_\- ]+", "", name).strip()
    return re.sub(r"\s+", "_", safe) or "report"


def read_tabular_upload(upload: UploadFile) -> pd.DataFrame:
    name = (upload.filename or "").lower()
    data = upload.file.read()
    upload.file.seek(0)
    bio = BytesIO(data)

    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(bio)
    # try CSV/TSV/TXT with automatic sep sniff
    try:
        return pd.read_csv(bio)
    except Exception:
        bio.seek(0)
        return pd.read_csv(bio, sep="\t")


# ===============================
# Routes
# ===============================
@app.get("/")
def read_root():
    return {"message": "Tanglish Sentiment Analyzer is running!"}


@app.post("/analyze/")
async def analyze_excel(
    file: UploadFile = File(...),
    eventName: str = Form(...),
    club: str = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    strength: str = Form(...),
):
    try:
        # --- Read table ---
        df = read_tabular_upload(file)
        if "text" not in df.columns:
            raise HTTPException(status_code=400, detail="File must contain a 'text' column")

        # --- Classify feedback ---
        sentiments, sources = [], []
        for text in df["text"].astype(str).fillna(""):
            sentiment, source = classify_sentiment(text)
            sentiments.append(sentiment)
            sources.append(source)

        df["Sentiment"] = sentiments
        df["Source"] = sources

        # --- Summary counts ---
        sentiment_order = ["Positive", "Neutral", "Negative"]
        sentiment_counts = df["Sentiment"].value_counts().reindex(sentiment_order, fill_value=0)

        summary_text = f"Total feedback entries: {len(df)}\n\n"
        for s in sentiment_order:
            summary_text += f"{s}: {sentiment_counts[s]}\n"
        summary_text += "\n---\n\n"
        for s in sentiment_order:
            summary_text += f"{s} Feedbacks:\n"
            for t in df.loc[df["Sentiment"] == s, "text"]:
                summary_text += f"- {t}\n"
            summary_text += "\n"

        # --- Chart (save to a safe temp file) ---
        plt.figure(figsize=(8, 5))
        bars = plt.barh(sentiment_order, sentiment_counts.values, color=["#4CAF50", "#FFC107", "#F44336"])
        plt.xlabel("Count")
        plt.title("Sentiment Distribution")
        for bar, count in zip(bars, sentiment_counts.values):
            plt.text(count + 0.5, bar.get_y() + bar.get_height() / 2, str(count), va="center")

        temp_chart_path = os.path.join(tempfile.gettempdir(), f"sentiment_{uuid4().hex}.jpg")
        plt.tight_layout()
        plt.savefig(temp_chart_path, format="jpg", bbox_inches="tight", dpi=200)
        plt.close()

        # --- Create PDF ---
        safe_event = sanitize_filename(eventName)
        club_dir = os.path.join(reports_dir, club)
        os.makedirs(club_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"{safe_event}_{timestamp}.pdf"
        abs_pdf_path = os.path.join(club_dir, pdf_filename)
        rel_pdf_path = f"{club}/{pdf_filename}"  # what React should use

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Event Feedback Report", ln=True, align="C")
        pdf.set_font("Arial", size=12)
        pdf.ln(5)
        pdf.multi_cell(0, 8, f"Event Name: {eventName}")
        pdf.multi_cell(0, 8, f"Organizing Club: {club}")
        pdf.multi_cell(0, 8, f"Description: {description}")
        pdf.multi_cell(0, 8, f"Date: {date}")
        pdf.multi_cell(0, 8, f"Participation Strength: {strength}")
        pdf.ln(6)
        pdf.multi_cell(0, 6, summary_text)

        pdf.add_page()
        max_width = pdf.w - 40  # keep margins
        x_pos = (pdf.w - max_width) / 2
        y_pos = 30
        pdf.image(temp_chart_path, x=x_pos, y=y_pos, w=max_width)

        pdf.output(abs_pdf_path)

        # Cleanup temp image
        try:
            if os.path.exists(temp_chart_path):
                os.remove(temp_chart_path)
        except Exception:
            pass

        # --- Save record in Mongo ---
        reports_collection.insert_one(
            {
                "club": club,
                "event": eventName,
                "description": description,
                "date": date,
                "strength": strength,
                "pdf_path": rel_pdf_path,  # stored relative path
                "created_at": datetime.now(),
            }
        )

        # --- JSON response for React ---
        return {
            "success": True,
            "pdfPath": rel_pdf_path,
            "event": eventName,
            "club": club,
        }

    except HTTPException:
        raise
    except Exception as e:
        # surface useful error to client
        return {"success": False, "error": str(e)}

@app.get("/api/reports/{club}")
def get_reports(club: str):
    reports = list(reports_collection.find({"club": club}, {"_id": 0}))
    return JSONResponse(content=jsonable_encoder(reports))
