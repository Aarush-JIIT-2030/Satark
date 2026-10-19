from __future__ import annotations

import json
import os
import unittest
from unittest.mock import patch

from firstlight_agents import AgentFinding, AgentResult, _parse_json, run_independent_agents


class FirstlightAgentContractTests(unittest.TestCase):
    def test_disabled_by_default_and_explicit_about_mode(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("FIRSTLIGHT_MODEL_AGENTS_ENABLED", None)
            result = run_independent_agents([])
        self.assertFalse(result["enabled"])
        self.assertEqual(result["mode"], "deterministic_only")

    def test_invalid_agent_json_is_rejected(self):
        for value in ("", "not json", "[]", "x" * 12001):
            with self.subTest(value=value[:20]):
                with self.assertRaises((ValueError, json.JSONDecodeError)):
                    _parse_json(value)

    def test_agent_schema_rejects_unknown_fields_and_bad_confidence(self):
        with self.assertRaises(Exception):
            AgentFinding.model_validate({
                "title": "Unsupported conclusion", "severity": "high",
                "rationale": "There is not enough supporting evidence.",
                "evidence_ids": ["EV-1"], "confidence": 1.2, "tool_call": "delete",
            })

    def test_agent_result_schema_requires_allowlisted_agent_and_status(self):
        with self.assertRaises(Exception):
            AgentResult.model_validate({
                "agent_id": "arbitrary-agent", "status": "ok", "summary": "x",
                "findings": [], "limitations": [],
            })

    def test_agent_evidence_bound_is_enforced_before_provider_calls(self):
        with patch.dict(os.environ, {"FIRSTLIGHT_MODEL_AGENTS_ENABLED": "true"}):
            with self.assertRaises(ValueError):
                run_independent_agents([{"id": str(i)} for i in range(501)])


if __name__ == "__main__":
    unittest.main()
