import json
from step5_logic import generate_contributions_and_claims

def run_test():
    with open("mock_input_steps_1_4.json", "r", encoding="utf-8") as f:
        context_data = json.load(f)

    print("--- Đầu vào từ các bước trước ---")
    print(json.dumps(context_data, indent=2, ensure_ascii=False))

    print("\n--- Đang gọi Bước 5 (Tạo Contribution và Claim) ---")
    output = generate_contributions_and_claims(context_data)

    if output:
        print("\n--- Kết quả đầu ra (Step 5 Output) ---")
        print(output.model_dump_json(indent=2))
    else:
        print("\nFailed to generate output.")

if __name__ == "__main__":
    run_test()
