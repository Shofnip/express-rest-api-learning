#!/usr/bin/env python3
"""
Simplified API test using Playwright for tarefas-api endpoints.
"""

import json
import sys
from playwright.sync_api import sync_playwright


def test_api():
    """Run simplified API endpoint tests."""

    base_url = "http://localhost:3000/api/tasks"
    passed = 0
    failed = 0

    with sync_playwright() as p:
        context = p.request.new_context(base_url="http://localhost:3000")

        print("[START] Running simplified API tests\n")

        try:
            # Test 1: Create task with priority
            print("[TEST 1] POST: Create task with all fields")
            resp = context.post("/api/tasks",
                headers={"Content-Type": "application/json"},
                data=json.dumps({
                    "title": "Learn Testing",
                    "description": "Test Playwright",
                    "priority": "high"
                })
            )
            assert resp.status == 201, "Status: {}".format(resp.status)
            data = resp.json()
            assert "id" in data
            assert data["title"] == "Learn Testing"
            assert data["priority"] == "high"
            task_id = data["id"]
            print("[PASS] Task created with ID: {}\n".format(task_id))
            passed += 1

            # Test 2: Get task
            print("[TEST 2] GET: Retrieve task by ID")
            resp = context.get("/api/tasks/{}".format(task_id))
            assert resp.status == 200
            data = resp.json()
            assert data["id"] == task_id
            assert data["priority"] == "high"
            print("[PASS] Task retrieved successfully\n")
            passed += 1

            # Test 3: Update task
            print("[TEST 3] PUT: Update task priority")
            resp = context.put("/api/tasks/{}".format(task_id),
                headers={"Content-Type": "application/json"},
                data=json.dumps({"priority": "low"})
            )
            assert resp.status == 200
            data = resp.json()
            assert data["priority"] == "low"
            print("[PASS] Task updated successfully\n")
            passed += 1

            # Test 4: Validation - invalid priority
            print("[TEST 4] POST: Validate priority values")
            resp = context.post("/api/tasks",
                headers={"Content-Type": "application/json"},
                data=json.dumps({
                    "title": "Bad priority",
                    "priority": "invalid"
                })
            )
            assert resp.status == 400
            error = resp.json()
            assert "error" in error
            print("[PASS] Invalid priority rejected\n")
            passed += 1

            # Test 5: List tasks
            print("[TEST 5] GET: List all tasks")
            resp = context.get("/api/tasks")
            assert resp.status == 200
            tasks = resp.json()
            assert len(tasks) > 0
            assert any(t["id"] == task_id for t in tasks)
            print("[PASS] Listed {} tasks\n".format(len(tasks)))
            passed += 1

            # Test 6: Mark as completed
            print("[TEST 6] PATCH: Mark task as completed")
            resp = context.patch("/api/tasks/{}/complete".format(task_id),
                headers={"Content-Type": "application/json"},
                data=json.dumps({})
            )
            assert resp.status == 200
            data = resp.json()
            assert data["isCompleted"] is True
            print("[PASS] Task marked as completed\n")
            passed += 1

            # Test 7: Set due date
            print("[TEST 7] PATCH: Set due date")
            resp = context.patch("/api/tasks/{}/due-date".format(task_id),
                headers={"Content-Type": "application/json"},
                data=json.dumps({"dueDate": "2026-08-15T18:00:00Z"})
            )
            assert resp.status == 200
            data = resp.json()
            assert data["dueDate"] == "2026-08-15T18:00:00Z"
            print("[PASS] Due date set\n")
            passed += 1

            # Test 8: Count tasks
            print("[TEST 8] GET: Count tasks")
            resp = context.get("/api/tasks/count")
            assert resp.status == 200
            data = resp.json()
            assert "count" in data
            print("[PASS] Total tasks: {}\n".format(data["count"]))
            passed += 1

            # Test 9: Count completed
            print("[TEST 9] GET: Count completed tasks")
            resp = context.get("/api/tasks/count?status=completed")
            assert resp.status == 200
            data = resp.json()
            assert data["count"] >= 1
            print("[PASS] Completed tasks: {}\n".format(data["count"]))
            passed += 1

            # Test 10: Delete task
            print("[TEST 10] DELETE: Delete task")
            resp = context.delete("/api/tasks/{}".format(task_id))
            assert resp.status == 200
            data = resp.json()
            assert "task" in data
            assert data["task"]["id"] == task_id
            print("[PASS] Task deleted\n")
            passed += 1

            # Test 11: Verify deletion
            print("[TEST 11] GET: Verify task deleted")
            resp = context.get("/api/tasks/{}".format(task_id))
            assert resp.status == 404
            print("[PASS] Task no longer exists\n")
            passed += 1

            context.dispose()

        except AssertionError as e:
            failed += 1
            print("[FAIL] {}\n".format(str(e)))
            context.dispose()
        except Exception as e:
            failed += 1
            print("[ERROR] {}\n".format(str(e)))
            import traceback
            traceback.print_exc()
            context.dispose()

    # Summary
    print("\n" + "="*60)
    print("[SUMMARY] API Test Results")
    print("="*60)
    print("[STATS] Passed: {}".format(passed))
    print("[STATS] Failed: {}".format(failed))
    print("="*60 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)
