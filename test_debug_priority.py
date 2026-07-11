#!/usr/bin/env python3
"""Debug script to compare curl vs Playwright response"""

import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    context = p.request.new_context(base_url="http://localhost:3000")

    # Test 1: Raw request
    print("[TEST 1] Raw POST request")
    response = context.post("/api/tasks",
        headers={"Content-Type": "application/json"},
        data=json.dumps({"title": "playwright test", "priority": "high"})
    )
    print("Status:", response.status)
    print("Headers:", dict(response.headers))
    raw_text = response.text()
    print("Raw response:", raw_text)

    # Test 2: Parse JSON
    print("\n[TEST 2] Parsed JSON")
    data = response.json()
    print("Parsed data:", data)
    print("Keys:", list(data.keys()))
    print("Has priority?", "priority" in data)
    print("priority value:", data.get("priority", "MISSING"))

    context.dispose()
