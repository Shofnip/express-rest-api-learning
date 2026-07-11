#!/usr/bin/env python3
"""
Comprehensive test suite for Tasks API using Playwright
Tests HTTP endpoints, validation rules, tags field, and priority filtering
"""

import json

def test_api_with_curl():
    """Test API endpoints using curl commands"""
    import subprocess

    base_url = "http://localhost:3000/api/tasks"
    passed = 0
    total = 0

    tests = [
        {
            "name": "GET /api/tasks - List all",
            "cmd": f'curl -s {base_url}',
            "check": "should return array"
        },
        {
            "name": "POST - Create with tags",
            "cmd": f"""curl -s -X POST {base_url} -H "Content-Type: application/json" -d '{{"title":"Test","priority":"high","tags":["api","test"]}}'""",
            "check": '"tags"'
        },
        {
            "name": "POST - Create without tags",
            "cmd": f"""curl -s -X POST {base_url} -H "Content-Type: application/json" -d '{{"title":"NoTags"}}'""",
            "check": '"tags":[]'
        },
        {
            "name": "GET - Filter by priority",
            "cmd": f'curl -s {base_url}/priority/high',
            "check": '"priority":"high"'
        },
        {
            "name": "Validation - Invalid priority",
            "cmd": f"""curl -s -X POST {base_url} -H "Content-Type: application/json" -d '{{"title":"Bad","priority":"urgente"}}'""",
            "check": 'Prioridade'
        },
        {
            "name": "Validation - Tags not array",
            "cmd": f"""curl -s -X POST {base_url} -H "Content-Type: application/json" -d '{{"title":"Bad","tags":"string"}}'""",
            "check": 'array'
        },
        {
            "name": "Validation - Too many tags",
            "cmd": f"""curl -s -X POST {base_url} -H "Content-Type: application/json" -d '{{"title":"Bad","tags":["1","2","3","4","5","6","7","8","9","10","11"]}}'""",
            "check": '10'
        }
    ]

    print("\n[START] Testing Tasks API with curl/Playwright")
    print("=" * 70)

    for test in tests:
        total += 1
        print(f"\n[TEST {total}] {test['name']}")
        try:
            result = subprocess.run(test['cmd'], shell=True, capture_output=True, text=True, timeout=5)
            output = result.stdout

            if test['check'] in output:
                print(f"  [PASS]")
                passed += 1
            else:
                print(f"  [FAIL] Expected '{test['check']}' not found")
                print(f"     Output: {output[:100]}")
        except Exception as e:
            print(f"  [ERROR] {e}")

    print("\n" + "=" * 70)
    print(f"[RESULTS] Passed: {passed}/{total}")
    if passed == total:
        print("[SUCCESS] All tests passed!")
    else:
        print(f"[WARNING] {total - passed} test(s) failed")
    print("=" * 70 + "\n")

    return passed == total

if __name__ == "__main__":
    success = test_api_with_curl()
    exit(0 if success else 1)
