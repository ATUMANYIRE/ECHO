"""Script to evaluate ECHO live Gemini AI on 5 unseen debugging scenarios."""

import asyncio
import time
import json
import httpx
from typing import Dict, Any, List

API_BASE = "http://127.0.0.1:8005"

SCENARIOS = [
    {
        "id": "UNSEEN-01",
        "category": "Logical bug without exception",
        "title": "Discount Calculation Formula (Missing Percentage Division)",
        "code": """subtotal = 50.0
discount_pct = 10
# Student forgot to divide discount_pct by 100
total = subtotal - (subtotal * discount_pct)
print(f"Total: {total}")""",
        "expected_behavior": "Given subtotal 50.0 and 10% discount, should calculate 10% discount ($5.0) and print Total: 45.0",
    },
    {
        "id": "UNSEEN-02",
        "category": "Runtime exception",
        "title": "Division by Zero in Rate Calculation",
        "code": """distance_km = 120.0
elapsed_hours = 0.0
speed = distance_km / elapsed_hours
print(f"Average speed: {speed} km/h")""",
        "expected_behavior": "Calculate average speed. If elapsed_hours is 0.0, handle or avoid ZeroDivisionError and print valid speed or warning.",
    },
    {
        "id": "UNSEEN-03",
        "category": "Function return bug",
        "title": "Early Return Inside Loop (Count Evens)",
        "code": """def count_evens(numbers):
    count = 0
    for n in numbers:
        if n % 2 == 0:
            count += 1
        return count  # Bug: Indented inside the loop!

items = [2, 4, 6, 7, 8]
result = count_evens(items)
print(f"Evens: {result}")""",
        "expected_behavior": "Count all even numbers in [2, 4, 6, 7, 8] and print Evens: 4 (currently returns 1 after first iteration).",
    },
    {
        "id": "UNSEEN-04",
        "category": "Mutable-state bug",
        "title": "Aliased List Replication (2D Grid Mutation)",
        "code": """# Bug: Multiplying list of list creates aliased references to the same row
grid = [[0] * 3] * 3
grid[0][0] = 9
print(grid)""",
        "expected_behavior": "Create 3x3 grid with only grid[0][0] modified to 9: [[9, 0, 0], [0, 0, 0], [0, 0, 0]] instead of [[9, 0, 0], [9, 0, 0], [9, 0, 0]].",
    },
    {
        "id": "UNSEEN-05",
        "category": "Ambiguous expected behavior",
        "title": "Vague Student Intent Description",
        "code": """scores = [10, 20, 30]
res = scores[0] + scores[1]
print(res)""",
        "expected_behavior": "Make it work properly and do the right thing",
    },
]


async def evaluate_scenario(client: httpx.AsyncClient, scenario: Dict[str, Any]) -> Dict[str, Any]:
    print(f"\nEvaluating {scenario['id']}: {scenario['title']} ({scenario['category']})...")
    
    # 1. Execute original code in Docker sandbox
    t0 = time.time()
    exec_resp = await client.post(f"{API_BASE}/api/execution/run", json={"code": scenario["code"]})
    exec_latency = time.time() - t0
    assert exec_resp.status_code == 200, f"Execution failed: {exec_resp.text}"
    trace = exec_resp.json()
    
    # 2. Analyze with Live Gemini
    t1 = time.time()
    analyze_payload = {
        "code": scenario["code"],
        "expected_behavior": scenario["expected_behavior"],
        "execution": trace,
    }
    analyze_resp = await client.post(f"{API_BASE}/api/investigation/analyze", json=analyze_payload, timeout=45.0)
    ai_latency = time.time() - t1
    assert analyze_resp.status_code == 200, f"Analysis failed: {analyze_resp.text}"
    analysis = analyze_resp.json()
    
    # 3. Check citations validity against trace
    total_steps = len(trace.get("steps", []))
    trace_lines = {s["line_number"] for s in trace.get("steps", [])}
    
    supporting_steps = analysis.get("supporting_step_indices", [])
    supporting_lines = analysis.get("relevant_lines", [])
    
    valid_steps = all(0 <= idx < total_steps for idx in supporting_steps)
    valid_lines = all(line in trace_lines for line in supporting_lines)
    
    # 4. Verify suggested correction in Docker sandbox
    suggested_code = analysis.get("suggested_correction", "")
    t2 = time.time()
    verify_resp = await client.post(
        f"{API_BASE}/api/investigation/verify-fix",
        json={
            "original_code": scenario["code"],
            "suggested_code": suggested_code,
            "expected_behavior": scenario["expected_behavior"],
        },
        timeout=45.0,
    )
    verify_latency = time.time() - t2
    assert verify_resp.status_code == 200, f"Fix verification failed: {verify_resp.text}"
    fix_res = verify_resp.json()
    
    result = {
        "scenario_id": scenario["id"],
        "category": scenario["category"],
        "title": scenario["title"],
        "model_identifier": analysis.get("model_identifier"),
        "is_live_ai": analysis.get("is_live_ai"),
        "observed_behavior": analysis.get("observed_behavior"),
        "expected_behavior": scenario["expected_behavior"],
        "root_cause_hypothesis": analysis.get("root_cause_hypothesis"),
        "explanation": analysis.get("explanation"),
        "evidence_sufficiency": analysis.get("evidence_sufficiency"),
        "supporting_step_indices": supporting_steps,
        "relevant_lines": supporting_lines,
        "valid_steps": valid_steps,
        "valid_lines": valid_lines,
        "suggested_correction": suggested_code,
        "correction_rationale": analysis.get("correction_rationale"),
        "sandbox_verification": {
            "is_verified": fix_res.get("is_verified"),
            "status": fix_res.get("status"),
            "verified_output": fix_res.get("verified_output"),
            "summary": fix_res.get("verification_summary"),
        },
        "latencies": {
            "execution_sec": round(exec_latency, 3),
            "ai_analysis_sec": round(ai_latency, 3),
            "sandbox_verify_sec": round(verify_latency, 3),
            "total_sec": round(exec_latency + ai_latency + verify_latency, 3),
        },
        "validation_warnings": analysis.get("validation_warnings", []),
    }
    
    print(f"  AI Model: {result['model_identifier']} (Live AI: {result['is_live_ai']})")
    print(f"  Diagnosis: {result['root_cause_hypothesis'][:90]}...")
    print(f"  Citations: Steps {supporting_steps} (valid: {valid_steps}), Lines {supporting_lines} (valid: {valid_lines})")
    print(f"  Sufficiency: {result['evidence_sufficiency']}")
    print(f"  Fix Verified in Sandbox: {result['sandbox_verification']['is_verified']} (Output: {result['sandbox_verification']['verified_output']})")
    print(f"  Latency: AI={result['latencies']['ai_analysis_sec']}s, Verify={result['latencies']['sandbox_verify_sec']}s")
    
    return result


async def main():
    async with httpx.AsyncClient() as client:
        # Check provider status first
        status_resp = await client.get(f"{API_BASE}/api/investigation/status")
        provider_status = status_resp.json()
        print(f"Active Provider: {provider_status}")
        assert provider_status["is_available"] and provider_status["is_configured"], "Live AI provider is not available!"
        
        results = []
        for sc in SCENARIOS:
            res = await evaluate_scenario(client, sc)
            results.append(res)
            # Small breath between calls to stay well within free tier limits
            await asyncio.sleep(2.0)
            
        with open("live_evaluation_results.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
            
        print("\nAll 5 unseen scenarios evaluated successfully! Results saved to live_evaluation_results.json.")

if __name__ == "__main__":
    asyncio.run(main())
