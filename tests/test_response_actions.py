import os
import unittest
from unittest.mock import patch

from integrations.response_actions import (
    ResponseIntegrationError,
    _confirm,
    isolate_defender_device,
    live_response_enabled,
    revoke_entra_user_sessions,
)


class GuardrailTests(unittest.TestCase):
    def test_live_actions_disabled_by_default(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(ResponseIntegrationError, "disabled"):
                _confirm("ISOLATE", "device-123", "CONFIRM ISOLATE device-123")

    def test_exact_confirmation_required(self):
        with patch.dict(os.environ, {"SATARK_ENABLE_LIVE_RESPONSE": "true"}):
            with self.assertRaisesRegex(ResponseIntegrationError, "Explicit confirmation"):
                _confirm("ISOLATE", "device-123", "yes")

    def test_confirmation_is_target_bound(self):
        with patch.dict(os.environ, {"SATARK_ENABLE_LIVE_RESPONSE": "true"}):
            with self.assertRaises(ResponseIntegrationError):
                _confirm("ISOLATE", "device-123", "CONFIRM ISOLATE device-456")

    def test_live_capability_flag(self):
        with patch.dict(os.environ, {"SATARK_ENABLE_LIVE_RESPONSE": "true"}):
            self.assertTrue(live_response_enabled())
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(live_response_enabled())

    def test_invalid_isolation_type_fails_before_authentication(self):
        with patch.dict(os.environ, {"SATARK_ENABLE_LIVE_RESPONSE": "true"}):
            with self.assertRaisesRegex(ResponseIntegrationError, "Isolation type"):
                isolate_defender_device("device-123", confirmation="CONFIRM ISOLATE device-123",
                                        isolation_type="Anything", reason="test")

    def test_invalid_upn_fails_before_authentication(self):
        with patch.dict(os.environ, {"SATARK_ENABLE_LIVE_RESPONSE": "true"}):
            with self.assertRaisesRegex(ResponseIntegrationError, "unsupported characters"):
                revoke_entra_user_sessions("bad/user", confirmation="CONFIRM REVOKE_SESSIONS bad/user",
                                           reason="test")


if __name__ == "__main__":
    unittest.main()
