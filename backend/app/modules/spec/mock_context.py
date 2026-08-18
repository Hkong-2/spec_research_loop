"""Mock Context data for Step 5 (Contribution & Claims)."""

def get_stage_5_mock_context() -> dict:
    return {
        "problem_statement": "Prompt thủ công có thể không ổn định.",
        "research_question": "Tối ưu nhiều vòng có giảm unsupported claims không?",
        "confirmed_gap": "Các phương pháp hiện tại chưa tối ưu trực tiếp ở mức claim-evidence. Chưa rõ việc tách output thành từng claim, kiểm tra evidence độc lập và dùng lỗi claim-level làm feedback có giúp giảm unsupported claims trong cùng ngân sách inference hay không.",
        "related_works": [
            {"title": "OPRO", "feedback_used": "Điểm tổng", "limitation": "Chưa phân tích lỗi theo từng claim"},
            {"title": "TextGrad", "feedback_used": "LLM feedback", "limitation": "Judge có thể bị bias"}
        ]
    }
