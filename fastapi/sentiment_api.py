import os
import pandas as pd
import joblib
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import FileResponse
from io import BytesIO
from matplotlib import pyplot as plt
from fpdf import FPDF
from PIL import Image
from textblob import TextBlob
import nltk
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# Download NLTK corpus
nltk.download('words')
from nltk.corpus import words as nltk_words
english_vocab = set(nltk_words.words())

# FastAPI app
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow React frontend to call API
origins = [
    "http://localhost:3000",
]

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
output_dir = os.path.join(BASE_DIR, "output")
os.makedirs(output_dir, exist_ok=True)

# Load model and vectorizer
model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

# Tanglish detection
def is_english_text(text, threshold=0.7):
    tokens = text.split()
    if not tokens:
        return False
    english_count = sum(1 for w in tokens if w.lower() in english_vocab)
    return (english_count / len(tokens)) >= threshold

# Sentiment classification
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

# Global variable to store latest PDF path
latest_pdf_path = os.path.join(output_dir, "sentiment_summary.pdf")

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
    strength: str = Form(...)
):
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))

        if "text" not in df.columns:
            return {"error": "Excel must contain a 'text' column"}

        # Classify each feedback
        sentiments, sources = [], []
        for text in df["text"]:
            sentiment, source = classify_sentiment(text)
            sentiments.append(sentiment)
            sources.append(source)

        df["Sentiment"] = sentiments
        df["Source"] = sources

        # Sentiment summary
        sentiment_order = ["Positive", "Neutral", "Negative"]
        sentiment_counts = df["Sentiment"].value_counts().reindex(sentiment_order, fill_value=0)

        summary_text = f"Total feedback entries: {len(df)}\n\n"
        for sentiment in sentiment_order:
            summary_text += f"{sentiment}: {sentiment_counts[sentiment]}\n"
        summary_text += "\n---\n\n"

        for sentiment in sentiment_order:
            filtered = df[df["Sentiment"] == sentiment]
            summary_text += f"{sentiment} Feedbacks:\n"
            for text in filtered["text"]:
                summary_text += f"- {text}\n"
            summary_text += "\n"

        # Chart
        plt.figure(figsize=(8, 5))
        bars = plt.barh(sentiment_order, sentiment_counts.values, color=["#4CAF50", "#FFC107", "#F44336"])
        plt.xlabel("Count")
        plt.title("Sentiment Distribution")
        for bar, count in zip(bars, sentiment_counts.values):
            plt.text(count + 0.5, bar.get_y() + bar.get_height()/2, str(count), va='center')

        chart_stream = BytesIO()
        plt.tight_layout()
        plt.savefig(chart_stream, format="PNG", bbox_inches="tight", dpi=200)
        plt.close()
        chart_stream.seek(0)
        chart_image = Image.open(chart_stream)

        # Convert chart to JPEG for FPDF
        temp_chart_path = os.path.join(output_dir, "temp_chart.jpg")
        chart_image.convert("RGB").save(temp_chart_path)

        # Create PDF
        pdf = FPDF()

        # ---- Page 1: Event Details + Summary ----
        pdf.add_page()
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Event Feedback Report", ln=True, align="C")
        pdf.set_font("Arial", size=12)
        pdf.ln(5)
        pdf.multi_cell(0, 10, f"Event Name: {eventName}")
        pdf.multi_cell(0, 10, f"Organizing Club: {club}")
        pdf.multi_cell(0, 10, f"Description: {description}")
        pdf.multi_cell(0, 10, f"Date: {date}")
        pdf.multi_cell(0, 10, f"Participation Strength: {strength}")
        pdf.ln(10)
        pdf.multi_cell(0, 10, summary_text)

        # ---- Page 2: Chart ----
        pdf.add_page()
        max_width = pdf.w - 40
        x_pos = (pdf.w - max_width) / 2
        y_pos = 30
        pdf.image(temp_chart_path, x=x_pos, y=y_pos, w=max_width)

        # Save PDF
        pdf.output(latest_pdf_path)

        # Remove temp chart file
        os.remove(temp_chart_path)

        return FileResponse(latest_pdf_path, media_type="application/pdf", filename="sentiment_summary.pdf")


    except Exception as e:
        print("🔥 ERROR:", str(e))
        return {"error": str(e)}

@app.get("/download-summary/")
def download_summary():
    """
    Endpoint to download the last generated PDF.
    """
    if os.path.exists(latest_pdf_path):
        return FileResponse(latest_pdf_path, media_type="application/pdf", filename="sentiment_summary.pdf")
    return {"error": "No PDF found. Please upload and analyze feedback first."}
