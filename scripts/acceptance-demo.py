"""ECHO Milestone 2 Acceptance Demonstration Script.

Executes the buggy program and corrected program against the live backend API,
validating and printing:
1. The actual program output.
2. Each iteration's relevant variable values.
3. The line that overwrites the total.
4. The final incorrect average.
5. A corrected run using total += score.
6. The correct result of 80.0.
"""

import urllib.request
import json
import sys

API_URL = "http://127.0.0.1:8005/api/execution/run"


def execute(code: str) -> dict:
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({"code": code, "expected_behavior": "Calculate average"}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    print("=" * 70)
    print("ECHO Milestone 2: Live Acceptance Demonstration")
    print("=" * 70)

    # 1. Buggy program
    buggy_code = """scores = [60, 80, 100]
total = 0
for score in scores:
    total = score
average = total / len(scores)
print(average)"""

    print("\n[PART 1] Executing Buggy Program inside Docker Sandbox:")
    print("-" * 50)
    print(buggy_code)
    print("-" * 50)

    res1 = execute(buggy_code)

    print(f"Status: {res1['status']}")
    print(f"Execution ID: {res1['execution_id']}")
    print(f"Authoritative Trace: {res1['is_authoritative']}")
    print(f"Duration: {res1['duration_ms']} ms")
    print(f"\n1. Actual Program Output: {repr(res1['stdout'])}")

    print("\n2. Each Iteration's Relevant Variable Values:")
    for step in res1["steps"]:
        line = step["line_number"]
        event = step["event_type"]
        snap = step["locals_snapshot"]
        if line in (3, 4) and event == "line":
            total_val = snap.get("total", {}).get("repr_value", "<unset>")
            score_val = snap.get("score", {}).get("repr_value", "<unset>")
            print(f"   Step #{step['step_index'] + 1} (Line {line}): score={score_val}, total={total_val}")

    print("\n3. Line that Overwrites the Total:")
    overwrite_steps = [s for s in res1["steps"] if s["line_number"] == 4 and s["event_type"] == "line"]
    for s in overwrite_steps:
        print(f"   Line 4 executed at Step #{s['step_index'] + 1}: overwriting total with {s['locals_snapshot']['score']['repr_value']}")

    print(f"\n4. Final Incorrect Average: {res1['stdout'].strip()} (Expected: 80.0)")

    # 2. Corrected program
    corrected_code = """scores = [60, 80, 100]
total = 0
for score in scores:
    total += score
average = total / len(scores)
print(average)"""

    print("\n" + "=" * 70)
    print("[PART 2] Executing Corrected Program (total += score) inside Docker Sandbox:")
    print("-" * 50)
    print(corrected_code)
    print("-" * 50)

    res2 = execute(corrected_code)

    print(f"Status: {res2['status']}")
    print(f"Execution ID: {res2['execution_id']}")
    print(f"Authoritative Trace: {res2['is_authoritative']}")
    print(f"Duration: {res2['duration_ms']} ms")

    print("\n5. Iterations with Accumulator (total += score):")
    for step in res2["steps"]:
        line = step["line_number"]
        event = step["event_type"]
        snap = step["locals_snapshot"]
        if line in (3, 4) and event == "line":
            total_val = snap.get("total", {}).get("repr_value", "<unset>")
            score_val = snap.get("score", {}).get("repr_value", "<unset>")
            print(f"   Step #{step['step_index'] + 1} (Line {line}): score={score_val}, total={total_val}")

    print(f"\n6. Correct Result Produced by Sandbox: {res2['stdout'].strip()}")
    print("=" * 70)


if __name__ == "__main__":
    main()
