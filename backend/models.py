from pydantic import BaseModel, Field
from typing import List

class ClaimEvidenceCard(BaseModel):
    claim: str = Field(..., description="Khẳng định cần chứng minh (Claim).")
    baseline: str = Field(..., description="Các phương pháp cơ sở để so sánh (Baseline).")
    metric: str = Field(..., description="Thang đo đánh giá (Metric).")
    evidence: str = Field(..., description="Bằng chứng thực nghiệm kỳ vọng (Evidence).")
    rejection_condition: str = Field(..., description="Điều kiện bác bỏ - Nếu xảy ra thì claim bị sai (Rejection condition).")

class Contribution(BaseModel):
    description: str = Field(..., description="Mô tả tóm tắt đóng góp (Contribution description).")
    type: str = Field(..., description="Loại đóng góp (Ví dụ: Thuật toán, Verifier, Dataset...).")
    claims: List[ClaimEvidenceCard] = Field(..., description="Danh sách các Claim-Evidence Cards liên quan đến đóng góp này.")

class Step5Output(BaseModel):
    contributions: List[Contribution] = Field(..., description="Danh sách các đóng góp và claim tương ứng.")
