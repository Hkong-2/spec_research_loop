from models import Step5Output
from llm_interface import generate_structured_output

def generate_contributions_and_claims(context_data: dict) -> Step5Output:
    """
    Nhận input từ các bước 1-4 và sử dụng LLM để sinh ra danh sách Contribution và Claim-Evidence Cards (Bước 5).
    """
    problem = context_data.get("problem", "")
    research_gap = context_data.get("research_gap", "")
    proposed_approach = context_data.get("proposed_approach", "")

    prompt = f"""
    Dựa vào các thông tin nghiên cứu sau đây từ các bước trước:

    1. Problem (Vấn đề): {problem}
    2. Research Gap (Khoảng trống nghiên cứu): {research_gap}
    3. Proposed Approach (Hướng tiếp cận đề xuất): {proposed_approach}

    Nhiệm vụ của bạn là thực hiện Bước 5: Xây dựng các Đóng góp (Contributions) và Luận điểm (Claims).
    Hãy tạo ra một danh sách các Đóng góp cụ thể (ví dụ: một framework, một verifier, một bộ dataset mới).
    Với mỗi Đóng góp, hãy định nghĩa các 'Claim-Evidence Card' tương ứng.
    Mỗi thẻ cần có:
    - claim: Khẳng định cần chứng minh.
    - baseline: Các phương pháp cơ sở để so sánh.
    - metric: Thang đo đánh giá.
    - evidence: Bằng chứng thực nghiệm kỳ vọng.
    - rejection_condition: Điều kiện bác bỏ (Nếu xảy ra thì claim bị sai).

    Trả về kết quả dưới dạng cấu trúc JSON chính xác theo yêu cầu.
    """

    output = generate_structured_output(prompt, Step5Output)
    return output
