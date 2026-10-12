"""Unit tests for optional threat-intelligence lookups; all network calls are mocked."""
import unittest
from urllib.parse import parse_qs
from unittest.mock import patch

from threat_intel import (
    ThreatIntelError, check_abuseipdb, enrich_submitted_url,
    extract_public_ipv4, is_public_ip, lookup_urlhaus,
)


class ThreatIntelTests(unittest.TestCase):
    def test_only_public_ipv4_is_checked(self):
        self.assertTrue(is_public_ip("8.8.8.8"))
        self.assertFalse(is_public_ip("127.0.0.1"))
        self.assertFalse(is_public_ip("192.168.1.2"))
        self.assertFalse(is_public_ip("2001:4860:4860::8888"))

    def test_extracts_deduplicated_public_ipv4_only(self):
        self.assertEqual(extract_public_ipv4("8.8.8.8 8.8.8.8 127.0.0.1 1.1.1.1"), ["8.8.8.8", "1.1.1.1"])

    def test_abuseipdb_rejects_private_ip_before_network(self):
        with self.assertRaisesRegex(ThreatIntelError, "public IPv4"):
            check_abuseipdb("10.0.0.1", "test-key")

    @patch("threat_intel._request", return_value={"query_status": "no_results"})
    def test_urlhaus_no_match_is_not_safe_verdict(self, mocked):
        result = lookup_urlhaus("https://example.com/path", "test-key")
        self.assertEqual(result["status"], "no_match")
        self.assertIn("does not prove", result["note"])
        mocked.assert_called_once()

    @patch("threat_intel._request", return_value={"query_status": "no_results"})
    def test_urlhaus_removes_query_and_fragment_before_external_sharing(self, mocked):
        result = lookup_urlhaus(
            "https://example.com/private-path?token=secret&email=user%40example.com#session",
            "test-key",
        )
        sent_body = mocked.call_args.kwargs["data"].decode("utf-8")
        self.assertEqual(parse_qs(sent_body)["url"], ["https://example.com/private-path"])
        self.assertEqual(result["indicator"], "https://example.com/private-path")
        self.assertNotIn("secret", sent_body)
        self.assertNotIn("session", sent_body)

    @patch("threat_intel._request")
    def test_urlhaus_rejects_embedded_credentials_before_external_sharing(self, mocked):
        with self.assertRaisesRegex(ThreatIntelError, "embedded credentials"):
            lookup_urlhaus("https://user:password@example.com/private", "test-key")
        mocked.assert_not_called()

    @patch("threat_intel._request", return_value={"data": {"ipAddress":"8.8.8.8","abuseConfidenceScore":25,"totalReports":3}})
    def test_abuseipdb_normalizes_result(self, mocked):
        result = check_abuseipdb("8.8.8.8", "test-key")
        self.assertEqual(result["abuse_confidence_score"], 25)
        self.assertEqual(result["total_reports"], 3)

    @patch("threat_intel.lookup_urlhaus", side_effect=ThreatIntelError("temporary failure"))
    @patch("threat_intel.check_abuseipdb", return_value={"provider":"AbuseIPDB","status":"checked","indicator":"8.8.8.8"})
    def test_provider_failure_does_not_hide_other_provider(self, check_ip, check_url):
        result = enrich_submitted_url("http://8.8.8.8/path", urlhaus_key="key", abuseipdb_key="key")
        self.assertEqual(len(result["results"]), 1)
        self.assertEqual(result["results"][0]["provider"], "AbuseIPDB")
        self.assertTrue(result["provider_notes"])


if __name__ == "__main__":
    unittest.main()
