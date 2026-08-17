import json
import os
from openai import OpenAI
from pydantic import BaseModel

def generate_structured_output(prompt: str, response_format: type[BaseModel], model: str = "gpt-4o-2024-08-06"):
    """
    Sử dụng OpenAI API với tính năng Structured Outputs để sinh ra JSON khớp với Pydantic model.
    """
    api_key = os.environ.get("OPENAI_API_KEY", "mock-key-for-testing")
    client = OpenAI(api_key=api_key)

    if api_key == "mock-key-for-testing":
        # Return mock data for local testing without API key
        if response_format.__name__ == "Step5Output":
            from models import Step5Output, Contribution, ClaimEvidenceCard
            return Step5Output(
                contributions=[
                    Contribution(
                        description="Một framework tối ưu prompt qua nhiều vòng bằng claim-level evidence feedback.",
                        type="Thuật toán",
                        claims=[
                            ClaimEvidenceCard(
                                claim="Phương pháp giảm unsupported claims.",
                                baseline="Human prompt, self-refine, OPRO-style optimizer.",
                                metric="Unsupported claim rate.",
                                evidence="Kết quả trên validation và hidden test.",
                                rejection_condition="Không cải thiện ổn định hoặc làm giảm coverage đáng kể."
                            )
                        ]
                    )
                ]
            )

    try:
        completion = client.beta.chat.completions.parse(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là một trợ lý AI giúp người dùng hoàn thiện ý tưởng nghiên cứu khoa học."},
                {"role": "user", "content": prompt}
            ],
            response_format=response_format,
        )
        return completion.choices[0].message.parsed
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None
