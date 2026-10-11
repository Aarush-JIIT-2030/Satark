"""Optional, privacy-aware threat-intelligence lookups for SATARK.

Only query when the user explicitly enables enrichment. API keys stay server-side.
A provider miss is not evidence that an indicator is benign.
"""
from __future__ import annotations

import ipaddress
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class ThreatIntelError(RuntimeError):
    """Safe error message for optional threat-intelligence failures."""


def _request(url: str, *, method: str = "GET", headers: dict[str, str] | None = None,
             data: bytes | None = None, timeout: float = 8.0) -> dict[str, Any]:
    request = urllib.request.Request(
        url, data=data, method=method,
        headers={"Accept": "application/json", "User-Agent": "SATARK-Sentinel/1.0", **(headers or {})},
    )

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, hdrs, newurl):
            return None

    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=timeout) as response:
            raw = response.read(262145)
            if len(raw) > 262144:
                raise ThreatIntelError("Threat-intelligence provider response was too large.")
            payload = json.loads(raw.decode("utf-8")) if raw else {}
            if not isinstance(payload, dict):
                raise ThreatIntelError("Threat-intelligence provider returned an unexpected response.")
            return payload
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            raise ThreatIntelError("Threat-intelligence rate limit reached; try again later.") from None
        if exc.code in (401, 403):
            raise ThreatIntelError("Threat-intelligence credentials were rejected; check the server secret and provider access.") from None
        raise ThreatIntelError(f"Threat-intelligence provider returned HTTP {exc.code}.") from None
    except (urllib.error.URLError, TimeoutError):
        raise ThreatIntelError("Threat-intelligence provider is unreachable or timed out.") from None
    except json.JSONDecodeError:
        raise ThreatIntelError("Threat-intelligence provider returned invalid JSON.") from None


def is_public_ip(value: str) -> bool:
    try:
        parsed = ipaddress.ip_address(value.strip())
        return parsed.version == 4 and parsed.is_global
    except ValueError:
        return False


def extract_public_ipv4(value: str, limit: int = 5) -> list[str]:
    candidates = re.findall(r"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])", value or "")
    found: list[str] = []
    for candidate in candidates:
        if is_public_ip(candidate) and candidate not in found:
            found.append(candidate)
        if len(found) >= limit:
            break
    return found


def lookup_urlhaus(url: str, auth_key: str) -> dict[str, Any]:
    """Look up one explicitly submitted URL in URLhaus."""
    if not auth_key.strip():
        raise ThreatIntelError("URLhaus is not configured.")
    parsed = urllib.parse.urlsplit(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ThreatIntelError("Enter a valid HTTP(S) URL before running URLhaus lookup.")
    body = urllib.parse.urlencode({"url": url.strip()}).encode("utf-8")
    payload = _request(
        "https://urlhaus-api.abuse.ch/v1/url/",
        method="POST",
        headers={"Auth-Key": auth_key.strip(), "Content-Type": "application/x-www-form-urlencoded"},
        data=body,
    )
    status = str(payload.get("query_status", "unknown"))
    if status == "ok":
        tags = payload.get("tags", [])
        return {
            "provider": "URLhaus", "status": "match", "indicator": url.strip(),
            "threat": str(payload.get("threat", "unknown"))[:120],
            "url_status": str(payload.get("url_status", "unknown"))[:40],
            "date_added": str(payload.get("date_added", ""))[:40],
            "tags": [str(tag)[:80] for tag in tags[:10]] if isinstance(tags, list) else [],
            "reference": "https://urlhaus.abuse.ch/",
            "note": "URLhaus returned a matching record. Verify the record and current context before acting.",
        }
    if status in {"no_results", "not_found"}:
        return {
            "provider": "URLhaus", "status": "no_match", "indicator": url.strip(),
            "reference": "https://urlhaus.abuse.ch/",
            "note": "No URLhaus record was returned. This does not prove the URL is safe.",
        }
    raise ThreatIntelError("URLhaus could not complete this lookup; check the key and provider status.")


def check_abuseipdb(ip_address: str, api_key: str, max_age_days: int = 90) -> dict[str, Any]:
    """Check one public IPv4 address; never submit private or reserved addresses."""
    if not api_key.strip():
        raise ThreatIntelError("AbuseIPDB is not configured.")
    if not is_public_ip(ip_address):
        raise ThreatIntelError("AbuseIPDB lookup requires a public IPv4 address.")
    query = urllib.parse.urlencode({"ipAddress": ip_address, "maxAgeInDays": max(1, min(365, int(max_age_days)))})
    payload = _request(
        "https://api.abuseipdb.com/api/v2/check?" + query,
        headers={"Key": api_key.strip(), "Accept": "application/json"},
    )
    data = payload.get("data")
    if not isinstance(data, dict):
        raise ThreatIntelError("AbuseIPDB returned an unexpected response.")
    return {
        "provider": "AbuseIPDB", "status": "checked",
        "indicator": str(data.get("ipAddress", ip_address))[:45],
        "abuse_confidence_score": max(0, min(100, int(data.get("abuseConfidenceScore", 0) or 0))),
        "total_reports": max(0, int(data.get("totalReports", 0) or 0)),
        "last_reported_at": str(data.get("lastReportedAt") or "")[:40],
        "country_code": str(data.get("countryCode") or "")[:8],
        "usage_type": str(data.get("usageType") or "")[:100],
        "reference": "https://www.abuseipdb.com/",
        "note": "Reputation is a signal, not proof of malicious activity; shared IPs and stale reports can mislead.",
    }


def enrich_submitted_url(url: str, *, urlhaus_key: str = "", abuseipdb_key: str = "") -> dict[str, Any]:
    """Query configured providers independently; one provider failure does not hide the other."""
    results: list[dict[str, Any]] = []
    errors: list[str] = []
    if urlhaus_key.strip():
        try:
            results.append(lookup_urlhaus(url, urlhaus_key))
        except ThreatIntelError as exc:
            errors.append(f"URLhaus: {exc}")
    else:
        errors.append("URLhaus: not configured")
    ips = extract_public_ipv4(url)
    if abuseipdb_key.strip() and ips:
        for ip in ips:
            try:
                results.append(check_abuseipdb(ip, abuseipdb_key))
            except ThreatIntelError as exc:
                errors.append(f"AbuseIPDB ({ip}): {exc}")
    elif not abuseipdb_key.strip():
        errors.append("AbuseIPDB: not configured")
    else:
        errors.append("AbuseIPDB: the submitted URL contains no public IPv4 literal; this provider checks IP addresses, not domain names.")
    return {"results": results, "provider_notes": errors, "queried": True}
