from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Hugging Face AI Service")

generator = pipeline("text-generation", model="gpt2")  # downloads model first time

class TextRequest(BaseModel):
    prompt: str
    max_length: int = 50

class TextResponse(BaseModel):
    generated_text: str

@app.get("/")
def root():
    return {"message": "Hugging Face AI service running 🚀"}

@app.post("/generate", response_model=TextResponse)
def generate_text(request: TextRequest):
    result = generator(request.prompt, max_length=request.max_length, num_return_sequences=1)
    return TextResponse(generated_text=result[0]["generated_text"])
