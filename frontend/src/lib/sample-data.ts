/**
 * Illustrative sample execution trace for Milestone 1 preview visualization.
 *
 * IMPORTANT: Execution evidence is authoritative. In Milestone 1, container sandbox
 * execution is not yet integrated. This pre-computed trace is explicitly labeled as
 * illustrative preview data to demonstrate UI behavior and timeline scrubbing without
 * falsely claiming real-time execution.
 */

import { SampleTraceData } from "./types";

export const SAMPLE_TRACE: SampleTraceData = {
  title: "Off-by-One Boundary Condition in List Summation",
  description: "Classic student error: loop counter exceeds list bounds by 1.",
  expected_behavior: "Iterate through elements in scores list, accumulate total sum, and print the calculated average.",
  code: `def calculate_average(scores):
    total = 0
    # Bug: range(len + 1) attempts to index past the end of the array
    for i in range(len(scores) + 1):
        total += scores[i]
    return total / len(scores)

test_scores = [85, 92, 78]
result = calculate_average(test_scores)
print(f"Average: {result}")`,
  error_message: "IndexError: list index out of range at line 5 (in calculate_average)",
  is_authoritative: false,
  disclaimer: "Illustrative Sample Trace Only — Real container execution will be active in Milestone 2.",
  steps: [
    {
      step_index: 0,
      line_number: 8,
      event_type: "line",
      function_name: "<module>",
      locals_snapshot: {
        test_scores: {
          name: "test_scores",
          type_name: "list",
          repr_value: "[85, 92, 78]",
          is_changed: true,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 1,
      line_number: 9,
      event_type: "call",
      function_name: "calculate_average",
      locals_snapshot: {
        scores: {
          name: "scores",
          type_name: "list",
          repr_value: "[85, 92, 78]",
          is_changed: true,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 2,
      line_number: 2,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        scores: {
          name: "scores",
          type_name: "list",
          repr_value: "[85, 92, 78]",
          is_changed: false,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "0",
          is_changed: true,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 3,
      line_number: 4,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "0",
          is_changed: true,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "0",
          is_changed: false,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 4,
      line_number: 5,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "0",
          is_changed: false,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "85",
          is_changed: true,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 5,
      line_number: 4,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "1",
          is_changed: true,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "85",
          is_changed: false,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 6,
      line_number: 5,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "1",
          is_changed: false,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "177",
          is_changed: true,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 7,
      line_number: 4,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "2",
          is_changed: true,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "177",
          is_changed: false,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 8,
      line_number: 5,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "2",
          is_changed: false,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "255",
          is_changed: true,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 9,
      line_number: 4,
      event_type: "line",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "3",
          is_changed: true,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "255",
          is_changed: false,
        },
      },
      stdout_delta: "",
      exception: null,
    },
    {
      step_index: 10,
      line_number: 5,
      event_type: "exception",
      function_name: "calculate_average",
      locals_snapshot: {
        i: {
          name: "i",
          type_name: "int",
          repr_value: "3",
          is_changed: false,
        },
        total: {
          name: "total",
          type_name: "int",
          repr_value: "255",
          is_changed: false,
        },
      },
      stdout_delta: "",
      exception: "IndexError: list index out of range (scores[3] exceeds len=3)",
    },
  ],
};
