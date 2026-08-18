import json
import os
from openai import AsyncOpenAI
from app.ports.llm import LlmPort

class OpenAIAdapter(LlmPort):
    def __init__(self):
        # We assume OPENAI_API_KEY is available in the environment if this adapter is used.
        # However, since this is just a mock setup, we can default to a fake implementation if no key is present.
        api_key = os.environ.get("OPENAI_API_KEY", "dummy")
        self.client = AsyncOpenAI(api_key=api_key) if api_key != "dummy" else None
        self.default_model = "gpt-4o-mini" # Fast default

    async def complete(self, *, system: str, prompt: str, model: str | None = None) -> str:
        if not self.client:
            # Fallback to a hardcoded mock JSON response if no OpenAI key is set, so the app still runs.
            return json.dumps({
                "contribution": "Một framework tối ưu prompt qua nhiều vòng bằng claim-level evidence feedback.",
                "cards": [
                    {
                        "claim": "Phương pháp giảm unsupported claims so với các phương pháp tối ưu điểm tổng.",
                        "baseline": "Human prompt, OPRO-style optimizer",
                        "metric": "Unsupported claim rate",
                        "evidence": "Kết quả thực nghiệm trên tập validation và hidden test.",
                        "rejection_condition": "Không cải thiện ổn định hoặc làm giảm coverage đáng kể."
                    }
                ]
            })

        response = await self.client.chat.completions.create(
            model=model or self.default_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content or "{}"
