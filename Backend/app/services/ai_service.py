
from abc import ABC, abstractmethod
import re
from groq import Groq

from app.core.config import settings


def _strip_thinking(text: str) -> str:
    """Safety net: some reasoning models can still leak their internal
    <think>...</think> chain-of-thought into the visible reply. Strip it
    so the user only ever sees the final answer."""
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()
    return cleaned or text


class AIProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        message: str,
        history: list[dict],
        image_base64: str | None = None,
        language: str | None = None,
        weather_context: str | None = None,
    ) -> str:
        pass

    @abstractmethod
    async def get_recommendations(self, context: dict) -> list[str]:
        pass


SYSTEM_PROMPT = """
You are ResQ AI, an intelligent and helpful AI assistant.

Responsibilities:
• Answer questions on programming, AI/ML, mathematics, science, history, geography, technology, education, career guidance, resumes, interview preparation, writing, general knowledge, disaster management, emergency response, and health awareness (do not diagnose diseases).

Language:
• Detect the user's language automatically.
• Reply in the same language.
• Support English, Hindi, Bengali, Gujarati, Marathi, Punjabi, Tamil, Telugu, Kannada, Malayalam, Odia, Assamese, Urdu, and other Indian languages.
• If replying in Hindi, use only Devanagari script (never Roman Hindi).

Formatting:
• Always follow the user's requested format.

Priority:
1. Language
2. Output format
3. Length

Rules:
• One sentence → exactly one sentence.
• Paragraph → exactly one paragraph.
• Bullets:
  • Use "• ".
  • One bullet per line.
  • No paragraphs before or after.
• Numbered steps → only numbered steps.
• Table → only a table.
• JSON → valid JSON only.
• Plain text → no Markdown.
• Code → clean, executable code.
• Examples → include only if requested.
• Detailed explanation → only if requested.
• Keep responses concise unless the user asks for more details.

Style:
• Default to plain text.
• Do not use Markdown headings (#, ##).
• Do not use bold unless requested.
• Never use "*" as a bullet.
• Do not add unnecessary explanations.

Programming:
• Write correct code.
• Explain or debug code when requested.
• Follow best coding practices.

Disaster Safety:
• Prioritize human safety.
• Give practical step-by-step guidance.
• Recommend official emergency services when appropriate.
• If live weather data is provided to you, treat it as real, current data and use it — never say you can't access weather.

General:
• Be friendly, professional, and accurate.
• Never invent facts.
• If uncertain, state the limitation.
"""


class GroqProvider(AIProvider):
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    async def chat(
        self,
        message: str,
        history: list[dict],
        image_base64: str | None = None,
        language: str | None = None,
        weather_context: str | None = None,
    ) -> str:

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            }
        ]

        if weather_context:
            # Real-time weather at the user's current location, fetched via
            # weather_service. Sent as its own system message (models treat
            # system content as authoritative, unlike a bracket inside the
            # user's own text, which some models second-guess or ignore).
            messages.append(
                {
                    "role": "system",
                    "content": (
                        f"Live weather data for the user's current location right now: {weather_context}. "
                        "This is real, verified data you have direct access to. When the user asks about "
                        "weather, going outside, travel safety, or what to wear, use these exact figures "
                        "directly in your answer. Never say you cannot access weather data or tell the user "
                        "to check it themselves — you already have it."
                    ),
                }
            )

        for item in history[-6:]:
            messages.append(
                {
                    "role": "assistant" if item["role"] == "bot" else "user",
                    "content": item["message"],
                }
            )

        # Mic input carries a language code (e.g. "hi-IN", "ta-IN") from the
        # browser's speech recognizer — pass it along so the reply matches it,
        # even if the transcribed text itself is short/ambiguous.
        user_text = message
        if language:
            user_text = f"[User is speaking in language code: {language}]\n{user_text}"

        if image_base64:
            # Image attached from the chatbot's camera/gallery button — use the
            # vision-capable model, same free Groq account, no extra key needed.
            messages.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_text},
                        {"type": "image_url", "image_url": {"url": image_base64}},
                    ],
                }
            )
            response = self.client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                messages=messages,
                temperature=0.5,
                max_tokens=400,
                top_p=0.9,
                reasoning_effort="none",
                reasoning_format="hidden",
            )
        else:
            messages.append(
                {
                    "role": "user",
                    "content": user_text,
                }
            )
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.5,
                max_tokens=400,
                top_p=0.9,
            )

        reply = response.choices[0].message.content.strip()
        return _strip_thinking(reply)

    async def get_recommendations(self, context: dict) -> list[str]:
        return [
            "Check the latest weather updates.",
            "Keep emergency contacts updated.",
            "Prepare an emergency kit.",
        ]


def get_ai_provider():
    if not settings.GROQ_API_KEY:
        raise Exception("GROQ_API_KEY not found in .env")

    return GroqProvider()
