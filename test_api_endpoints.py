#!/usr/bin/env python3
"""
Test script for tarefas-api endpoints using Playwright.
Tests all CRUD operations and validation rules.
"""

import json
import sys
from playwright.sync_api import sync_playwright, expect


def test_api():
    """Run comprehensive API endpoint tests."""

    base_url = "http://localhost:3000/api/tasks"
    test_results = {"passed": 0, "failed": 0, "errors": []}

    with sync_playwright() as p:
        # Create a request context for making HTTP calls
        context = p.request.new_context(base_url="http://localhost:3000")

        print("[START] Starting API Tests\n")

        try:
            # ========== TEST 1: Create Task ==========
            print("[TEST 1] Create a task with all fields")
            response = context.post("/api/tasks", headers={"Content-Type": "application/json"}, data=json.dumps({
                "title": "Learn Express",
                "description": "Study middleware and routing",
                "completed": False,
                "priority": "high"
            }))
            if response.status != 201:
                print("[DEBUG] Status: {}".format(response.status))
                print("[DEBUG] Response: {}".format(response.text()))
            assert response.status == 201, "Expected 201, got {}".format(response.status)
            task1 = response.json()
            assert task1["id"] == 1
            assert task1["title"] == "Learn Express"
            assert task1["priority"] == "high"
            print("[PASS] Task created successfully\n")
            test_results["passed"] += 1

            # ========== TEST 2: Create Task without optional fields ==========
            print("[TEST 2] Create a task without optional fields")
            response = context.post("/api/tasks", headers={"Content-Type": "application/json"}, data=json.dumps({
                "title": "Test API"
            }))
            assert response.status == 201
            task2 = response.json()
            assert task2["id"] == 2
            assert task2["description"] == ""
            assert task2["completed"] is False
            assert task2["priority"] is None
            print("[PASS] Task with defaults created successfully\n")
            test_results["passed"] += 1

            # ========== TEST 3: Validation - Missing title ==========
            print("[TEST 3] Validation - Missing required title")
            response = context.post("/api/tasks", headers={"Content-Type": "application/json"}, data=json.dumps({
                "description": "No title provided"
            }))
            assert response.status == 400
            error = response.json()
            assert "título" in error["error"].lower()
            print("[PASS] Validation correctly rejected missing title\n")
            test_results["passed"] += 1

            # ========== TEST 4: Validation - Invalid priority ==========
            print("[TEST 4] Validation - Invalid priority value")
            response = context.post("/api/tasks", headers={"Content-Type": "application/json"}, data=json.dumps({
                "title": "Task with bad priority",
                "priority": "super-urgent"
            }))
            assert response.status == 400
            error = response.json()
            assert "priority" in error["error"].lower() or "prioridade" in error["error"].lower()
            print("[PASS] Validation correctly rejected invalid priority\n")
            test_results["passed"] += 1

            # ========== TEST 5: List all tasks ==========
            print("[TEST 5] List all tasks")
            response = context.get("/api/tasks")
            assert response.status == 200
            tasks = response.json()
            assert len(tasks) == 2
            assert tasks[0]["id"] == 1
            assert tasks[1]["id"] == 2
            print("[PASS] Listed {} tasks\n".format(len(tasks)))
            test_results["passed"] += 1

            # ========== TEST 6: Get task by ID ==========
            print("[TEST 6] Get task by ID")
            response = context.get(f"/api/tasks/1")
            assert response.status == 200
            task = response.json()
            assert task["id"] == 1
            assert task["title"] == "Learn Express"
            print("[PASS] Retrieved task by ID\n")
            test_results["passed"] += 1

            # ========== TEST 7: Get non-existent task ==========
            print("[TEST 7] Get non-existent task (404)")
            response = context.get("/api/tasks/999")
            assert response.status == 404
            error = response.json()
            assert "não encontrada" in error["error"].lower()
            print("[PASS] Correctly returned 404 for missing task\n")
            test_results["passed"] += 1

            # ========== TEST 8: Update task ==========
            print("[TEST 8] Update task via PUT")
            response = context.put("/api/tasks/1", headers={"Content-Type": "application/json"}, data=json.dumps({
                "title": "Learn Express - Advanced",
                "priority": "low"
            }))
            assert response.status == 200
            updated = response.json()
            assert updated["title"] == "Learn Express - Advanced"
            assert updated["priority"] == "low"
            assert updated["createdAt"] == task1["createdAt"]
            print("[PASS] Task updated successfully\n")
            test_results["passed"] += 1

            # ========== TEST 9: Try to update immutable fields ==========
            print("[TEST 9] Validation - Cannot update id or createdAt")
            response = context.put("/api/tasks/1", headers={"Content-Type": "application/json"}, data=json.dumps({
                "id": 999
            }))
            assert response.status == 400
            error = response.json()
            assert "id" in error["error"] or "createdAt" in error["error"]
            print("[PASS] Correctly rejected update to immutable fields\n")
            test_results["passed"] += 1

            # ========== TEST 10: Mark task as completed ==========
            print("[TEST 10] Mark task as completed (PATCH)")
            response = context.patch("/api/tasks/1/complete", headers={"Content-Type": "application/json"}, data=json.dumps({}))
            assert response.status == 200
            completed = response.json()
            assert completed["completed"] is True
            print("[PASS] Task marked as completed\n")
            test_results["passed"] += 1

            # ========== TEST 11: List by status ==========
            print("[TEST 11] Filter tasks by status")
            response = context.get("/api/tasks/status/completed")
            assert response.status == 200
            tasks = response.json()
            assert len(tasks) == 1
            assert tasks[0]["id"] == 1
            print("[PASS] Filtered completed tasks\n")
            test_results["passed"] += 1

            # ========== TEST 12: Set due date ==========
            print("[TEST 12] Set due date via PATCH")
            response = context.patch("/api/tasks/2/due-date", headers={"Content-Type": "application/json"}, data=json.dumps({
                "dueDate": "2026-08-15T18:00:00Z"
            }))
            assert response.status == 200
            dated = response.json()
            assert dated["dueDate"] == "2026-08-15T18:00:00Z"
            print("[PASS] Due date set successfully\n")
            test_results["passed"] += 1

            # ========== TEST 13: Invalid due date ==========
            print("[TEST 13] Validation - Invalid due date format")
            response = context.patch("/api/tasks/2/due-date", headers={"Content-Type": "application/json"}, data=json.dumps({
                "dueDate": "not-a-date"
            }))
            assert response.status == 400
            error = response.json()
            assert "data" in error["error"].lower() or "date" in error["error"].lower()
            print("[PASS] Correctly rejected invalid date format\n")
            test_results["passed"] += 1

            # ========== TEST 14: Count tasks ==========
            print("[TEST 14] Count tasks endpoint")
            response = context.get("/api/tasks/count")
            assert response.status == 200
            count = response.json()
            assert count["count"] == 2
            print("[PASS] Count endpoint working\n")
            test_results["passed"] += 1

            # ========== TEST 15: Count by status ==========
            print("[TEST 15] Count tasks by status")
            response = context.get("/api/tasks/count?status=completed")
            assert response.status == 200
            count = response.json()
            assert count["count"] == 1
            print("[PASS] Filtered count working\n")
            test_results["passed"] += 1

            # ========== TEST 16: Delete task ==========
            print("[TEST 16] Delete a task")
            response = context.delete("/api/tasks/2")
            assert response.status == 200
            deleted = response.json()
            assert "task" in deleted
            assert deleted["task"]["id"] == 2
            print("[PASS] Task deleted successfully\n")
            test_results["passed"] += 1

            # ========== TEST 17: Verify deletion ==========
            print("[TEST 17] Verify task was actually deleted")
            response = context.get("/api/tasks/2")
            assert response.status == 404
            print("[PASS] Deleted task no longer exists\n")
            test_results["passed"] += 1

            # ========== TEST 18: Verify list after deletion ==========
            print("[TEST 18] Verify list has only 1 task after deletion")
            response = context.get("/api/tasks")
            assert response.status == 200
            tasks = response.json()
            assert len(tasks) == 1
            print("[PASS] List correctly reflects deleted task\n")
            test_results["passed"] += 1

            context.dispose()

        except AssertionError as e:
            test_results["failed"] += 1
            test_results["errors"].append(str(e))
            print("[FAIL] {}\n".format(str(e)))
            context.dispose()
            return False
        except Exception as e:
            test_results["failed"] += 1
            test_results["errors"].append(str(e))
            print("[ERROR] {}\n".format(str(e)))
            context.dispose()
            return False

    # Print summary
    print("\n" + "="*60)
    print("[SUMMARY] Test Results")
    print("="*60)
    print("[STATS] Passed: {}".format(test_results['passed']))
    print("[STATS] Failed: {}".format(test_results['failed']))

    if test_results["errors"]:
        print("\n[ERRORS]")
        for error in test_results["errors"]:
            print("  - {}".format(error))

    print("="*60)

    return test_results["failed"] == 0


if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)
