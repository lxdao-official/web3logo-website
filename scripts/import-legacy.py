#!/usr/bin/env python3
"""Snapshot the active legacy Web3Logo catalog into deterministic static files.

Only aggregate counts are written to stdout. The raw response is saved verbatim to
migration/legacy-active-export.json and is never logged.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import http.client
import ipaddress
import json
import os
import re
import shutil
import socket
import sys
import tempfile
import time
import unicodedata
import urllib.parse
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PAGE_SIZE = 10_000
DEFAULT_MAX_BYTES = 5 * 1024 * 1024
LEGACY_ASSET_HOSTS = frozenset({"cdn.lxdao.io"})
ALLOWED_CATEGORIES = {
    "DeFi",
    "NFTs",
    "DID",
    "Wallet",
    "Plugin",
    "DAO",
    "SocialFi",
    "GameFi",
    "Public Chain",
    "Other",
}
SVG_FORBIDDEN_TAGS = {"script", "foreignobject", "iframe", "object", "embed"}
SVG_URL_ATTRIBUTES = {"href", "src"}


class ImportFailure(RuntimeError):
    pass


class UnsupportedFormat(ImportFailure):
    pass


class DownloadFailure(ImportFailure):
    pass


class UnsafeURL(DownloadFailure):
    pass


class OversizedAsset(ImportFailure):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument(
        "--api-base",
        help="Legacy API origin/base path; /logos/findLogoName is appended",
    )
    source.add_argument(
        "--catalog-url",
        help="Complete legacy catalog URL (must return all active records)",
    )
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES)
    parser.add_argument(
        "--output-root",
        type=Path,
        default=ROOT,
        help="Repository root to populate (useful for deterministic test runs)",
    )
    return parser.parse_args()


def catalog_url(args: argparse.Namespace) -> str:
    if args.catalog_url:
        return args.catalog_url
    base = args.api_base.rstrip("/")
    return f"{base}/logos/findLogoName?{urllib.parse.urlencode({'page': 0, 'size': DEFAULT_PAGE_SIZE})}"


def is_global_address(value: str) -> bool:
    try:
        return ipaddress.ip_address(value.split("%", 1)[0]).is_global
    except ValueError:
        return False


def validate_remote_url(url: str, allowed_hosts: set[str] | frozenset[str]) -> urllib.parse.SplitResult:
    try:
        parsed = urllib.parse.urlsplit(url)
        port = parsed.port
    except ValueError as error:
        raise UnsafeURL("remote URL is malformed") from error
    hostname = (parsed.hostname or "").casefold()
    if parsed.scheme.casefold() != "https" or not hostname:
        raise UnsafeURL("remote URL must use HTTPS")
    if parsed.username or parsed.password or parsed.fragment:
        raise UnsafeURL("remote URL must not contain credentials or a fragment")
    if port not in (None, 443):
        raise UnsafeURL("remote URL must use the standard HTTPS port")
    if hostname not in {host.casefold() for host in allowed_hosts}:
        raise UnsafeURL("remote URL host is not allowlisted")

    try:
        addresses = {
            result[4][0]
            for result in socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
        }
    except socket.gaierror as error:
        raise UnsafeURL("remote URL host could not be resolved") from error
    if not addresses or any(not is_global_address(address) for address in addresses):
        raise UnsafeURL("remote URL resolves to a non-public address")
    return parsed


def fetch_file_bytes(url: str, max_bytes: int) -> bytes:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "file" or parsed.netloc not in ("", "localhost") or parsed.query or parsed.fragment:
        raise UnsafeURL("local snapshot must be a plain file URL")
    path = Path(urllib.parse.unquote(parsed.path))
    try:
        with path.open("rb") as source:
            body = source.read(max_bytes + 1)
    except OSError as error:
        raise DownloadFailure("local snapshot could not be read") from error
    if len(body) > max_bytes:
        raise OversizedAsset(f"response exceeds {max_bytes} byte limit")
    return body


def fetch_https_once(parsed: urllib.parse.SplitResult, timeout: float, max_bytes: int) -> bytes:
    hostname = parsed.hostname
    assert hostname is not None
    connection = http.client.HTTPSConnection(hostname, 443, timeout=timeout)
    try:
        connection.connect()
        if connection.sock is None:
            raise DownloadFailure("HTTPS connection has no peer")
        peer = str(connection.sock.getpeername()[0])
        if not is_global_address(peer):
            raise UnsafeURL("connected peer is not a public address")

        path = urllib.parse.quote(parsed.path or "/", safe="/%:@-._~!$&'()*+,;=")
        if parsed.query:
            path += "?" + urllib.parse.quote(parsed.query, safe="=&%:@/?-._~!$'()*+,;")
        connection.request(
            "GET",
            path,
            headers={
                "Accept": "application/json,image/*,*/*;q=0.5",
                "User-Agent": "web3logo-static-import/1",
            },
        )
        response = connection.getresponse()
        if 300 <= response.status < 400:
            raise UnsafeURL("redirect responses are not permitted")
        if not 200 <= response.status < 300:
            raise DownloadFailure(f"remote server returned HTTP {response.status}")
        length = response.headers.get("Content-Length")
        if length:
            try:
                if int(length) > max_bytes:
                    raise OversizedAsset(f"response exceeds {max_bytes} byte limit")
            except ValueError as error:
                raise DownloadFailure("remote server returned an invalid Content-Length") from error
        body = response.read(max_bytes + 1)
        if len(body) > max_bytes:
            raise OversizedAsset(f"response exceeds {max_bytes} byte limit")
        return body
    finally:
        connection.close()


def fetch_bytes(
    url: str,
    timeout: float,
    retries: int,
    max_bytes: int,
    *,
    allowed_hosts: set[str] | frozenset[str],
    allow_file: bool = False,
) -> bytes:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme == "file":
        if not allow_file:
            raise UnsafeURL("file URLs are not permitted for remote assets")
        return fetch_file_bytes(url, max_bytes)
    parsed = validate_remote_url(url, allowed_hosts)

    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return fetch_https_once(parsed, timeout, max_bytes)
        except (OversizedAsset, UnsafeURL):
            raise
        except (DownloadFailure, http.client.HTTPException, TimeoutError, OSError) as error:
            last_error = error
            if attempt < retries:
                time.sleep(0.4 * (2**attempt))
    raise DownloadFailure(f"download failed after {retries + 1} attempts: {last_error}")


def text(value: Any, field: str, *, required: bool = False) -> str:
    result = unicodedata.normalize("NFKC", str(value or "")).strip()
    result = re.sub(r"\s+", " ", result)
    if required and not result:
        raise ImportFailure(f"missing required {field}")
    return result


def integer(value: Any, field: str) -> int:
    if isinstance(value, bool):
        raise ImportFailure(f"invalid {field}")
    try:
        result = int(value)
    except (TypeError, ValueError) as error:
        raise ImportFailure(f"invalid {field}") from error
    if result < 0:
        raise ImportFailure(f"invalid {field}")
    return result


def slug_base(name: str, legacy_id: int) -> str:
    normalized = unicodedata.normalize("NFKD", name).casefold()
    ascii_name = "".join(char for char in normalized if not unicodedata.combining(char))
    ascii_name = ascii_name.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name).strip("-")
    return slug or f"logo-{legacy_id}"


def assign_slugs(records: list[dict[str, Any]]) -> dict[int, str]:
    groups: dict[str, list[int]] = {}
    for record in records:
        legacy_id = integer(record.get("id"), "logo id")
        name = text(record.get("logoName"), "logo name", required=True)
        groups.setdefault(slug_base(name, legacy_id), []).append(legacy_id)

    result: dict[int, str] = {}
    for base, ids in sorted(groups.items()):
        ordered = sorted(ids)
        for index, legacy_id in enumerate(ordered):
            result[legacy_id] = base if index == 0 else f"{base}-{legacy_id}"
    return result


def identify_format(body: bytes) -> tuple[str, str]:
    if body.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if body.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if body.startswith(b"RIFF") and len(body) >= 12 and body[8:12] == b"WEBP":
        return "webp", "image/webp"
    probe = body[:4096].lstrip(b"\xef\xbb\xbf\x00\t\r\n ")
    if re.match(
        rb"^(?:<\?xml[^>]*>\s*)?(?:<!--.*?-->\s*)*<svg(?:\s|/?>)",
        probe,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        return "svg", "image/svg+xml"
    raise UnsupportedFormat("unsupported asset bytes (allowed: SVG, PNG, JPEG, WebP)")


def sanitize_svg(body: bytes) -> bytes:
    try:
        source = body.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ImportFailure("SVG is not valid UTF-8") from error
    if re.search(r"<!DOCTYPE|<!ENTITY", source, flags=re.IGNORECASE):
        raise ImportFailure("SVG contains a doctype or entity declaration")
    if re.search(r"<\?xml-stylesheet\b", source, flags=re.IGNORECASE):
        raise ImportFailure("SVG contains an external stylesheet instruction")
    source = re.sub(r"<!--.*?-->", "", source, flags=re.DOTALL)

    import xml.etree.ElementTree as element_tree

    try:
        root = element_tree.fromstring(source)
    except element_tree.ParseError as error:
        raise ImportFailure(f"invalid SVG XML: {error}") from error
    if root.tag.rsplit("}", 1)[-1].lower() != "svg":
        raise ImportFailure("SVG root element is not <svg>")
    def unsafe_css(value: str) -> bool:
        lowered = value.casefold()
        if re.search(r"@import|expression\s*\(|-moz-binding", lowered):
            return True
        for match in re.finditer(r"url\s*\(([^)]*)\)", value, flags=re.IGNORECASE):
            target = match.group(1).strip().strip("'\"").strip()
            if target and not target.startswith("#"):
                return True
        return False

    for element in root.iter():
        tag = element.tag.rsplit("}", 1)[-1].lower()
        if tag in SVG_FORBIDDEN_TAGS:
            raise ImportFailure(f"SVG contains forbidden <{tag}> element")
        for raw_name, raw_value in element.attrib.items():
            name = raw_name.rsplit("}", 1)[-1].lower()
            value = raw_value.strip()
            lowered = value.casefold().replace("\x00", "")
            if name.startswith("on"):
                raise ImportFailure(f"SVG contains event handler {name}")
            if "javascript:" in lowered or "vbscript:" in lowered:
                raise ImportFailure("SVG contains an executable URL")
            if name in SVG_URL_ATTRIBUTES and value and not value.startswith("#"):
                raise ImportFailure("SVG contains an external reference")
            if name == "style" and unsafe_css(value):
                raise ImportFailure("SVG style contains an external reference")
        if tag == "style" and element.text and unsafe_css(element.text):
            raise ImportFailure("SVG style contains an external reference")
    return (source.strip() + "\n").encode("utf-8")


def extract_records(raw: bytes) -> list[dict[str, Any]]:
    try:
        payload = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ImportFailure("legacy catalog response is not valid JSON") from error
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
        raise ImportFailure("legacy catalog must contain a data array")
    records = payload["data"]
    total = integer(payload.get("total"), "catalog total")
    # The legacy service counts every LogoName row in `total`, then removes rows
    # without an active Logo from `data`. A larger total is therefore expected
    # and is preserved in the raw snapshot; a smaller total is inconsistent.
    if total < len(records):
        raise ImportFailure(
            f"catalog response is inconsistent: response has {len(records)} records but total is {total}"
        )
    # The importer requests 10,000 rows. Hitting that boundary would make it
    # impossible to prove that the active result set is complete.
    if len(records) >= DEFAULT_PAGE_SIZE:
        raise ImportFailure("catalog response reached the page-size boundary")
    ids = [integer(record.get("id"), "logo id") for record in records if isinstance(record, dict)]
    if len(ids) != len(records) or len(ids) != len(set(ids)):
        raise ImportFailure("catalog records must be objects with unique IDs")
    return records


def asset_job(
    task: tuple[int, str, int, dict[str, Any]],
    stage_assets: Path,
    args: argparse.Namespace,
) -> tuple[int, dict[str, Any] | None, dict[str, Any] | None]:
    legacy_logo_id, slug, index, source = task
    asset_id = integer(source.get("id"), "asset id")
    source_url = str(source.get("file") or "").strip()
    try:
        body = fetch_bytes(
            source_url,
            args.timeout,
            args.retries,
            args.max_bytes,
            allowed_hosts=LEGACY_ASSET_HOSTS,
        )
    except (DownloadFailure, OversizedAsset) as error:
        if isinstance(error, OversizedAsset):
            reason = "oversized-asset"
        elif isinstance(error, UnsafeURL):
            reason = "unsafe-url"
        else:
            reason = "download-failed"
        return (
            legacy_logo_id,
            None,
            {
                "legacyLogoId": legacy_logo_id,
                "legacyAssetId": asset_id,
                "sourceUrl": source_url,
                "reason": reason,
                "details": str(error),
            },
        )
    try:
        extension, media_type = identify_format(body)
    except UnsupportedFormat:
        return (
            legacy_logo_id,
            None,
            {
                "legacyLogoId": legacy_logo_id,
                "legacyAssetId": asset_id,
                "sourceUrl": source_url,
                "reason": "unsupported-format",
            },
        )
    if extension == "svg":
        try:
            body = sanitize_svg(body)
        except ImportFailure as error:
            return (
                legacy_logo_id,
                None,
                {
                    "legacyLogoId": legacy_logo_id,
                    "legacyAssetId": asset_id,
                    "sourceUrl": source_url,
                    "reason": "unsafe-svg",
                    "details": str(error),
                },
            )
    directory = stage_assets / slug
    directory.mkdir(parents=True, exist_ok=True)
    local_name = f"{asset_id}.{extension}"
    local_file = directory / local_name
    local_file.write_bytes(body)
    metadata = {
        "legacyId": asset_id,
        "name": text(source.get("fileName"), "asset name") or f"{slug}-{index + 1}",
        "format": extension,
        "mediaType": media_type,
        "path": f"/logos/{slug}/{local_name}",
        "sha256": hashlib.sha256(body).hexdigest(),
        "bytes": len(body),
        "sourceUrl": source_url,
    }
    return legacy_logo_id, metadata, None


def stable_json(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


def remove_path(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
    elif path.exists() or path.is_symlink():
        path.unlink()


def transaction_journal(targets: list[Path]) -> Path:
    if not targets:
        raise ImportFailure("transaction requires at least one target")
    common_parent = Path(os.path.commonpath([str(target.parent.resolve()) for target in targets]))
    return common_parent / ".web3logo-import-transaction.json"


def fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def fsync_directory_chain(path: Path, stop: Path) -> None:
    current = path.resolve()
    boundary = stop.resolve()
    while True:
        fsync_directory(current)
        if current == boundary:
            return
        if boundary not in current.parents:
            raise ImportFailure("durability boundary is not an ancestor of target directory")
        current = current.parent


def fsync_file(path: Path) -> None:
    with path.open("rb") as source:
        os.fsync(source.fileno())


def fsync_tree(path: Path) -> None:
    if path.is_file():
        fsync_file(path)
        return
    for child in path.iterdir():
        if child.is_symlink():
            raise ImportFailure("staged import tree must not contain symlinks")
        fsync_tree(child)
    fsync_directory(path)


def write_transaction_journal(targets: list[Path], existed: list[bool], phase: str) -> None:
    journal = transaction_journal(targets)
    journal.parent.mkdir(parents=True, exist_ok=True)
    temporary = journal.with_suffix(".json.tmp")
    body = stable_json(
        {
            "schemaVersion": 1,
            "phase": phase,
            "targets": [
                {"path": str(target.resolve()), "existed": had_target}
                for target, had_target in zip(targets, existed, strict=True)
            ],
        }
    )
    with temporary.open("wb") as output:
        output.write(body)
        output.flush()
        os.fsync(output.fileno())
    os.replace(temporary, journal)
    fsync_directory(journal.parent)


def recover_transaction(targets: list[Path]) -> None:
    journal = transaction_journal(targets)
    temporary = journal.with_suffix(".json.tmp")
    backups = {target: target.with_name(f".{target.name}.import-backup") for target in targets}
    if not journal.exists():
        removed_temporary = temporary.exists() or temporary.is_symlink()
        remove_path(temporary)
        if removed_temporary:
            fsync_directory(journal.parent)
        if any(backup.exists() or backup.is_symlink() for backup in backups.values()):
            raise ImportFailure("orphaned import backup requires manual review")
        return

    try:
        payload = json.loads(journal.read_text("utf-8"))
        entries = payload["targets"]
        phase = payload["phase"]
    except (OSError, KeyError, TypeError, json.JSONDecodeError) as error:
        raise ImportFailure("import transaction journal is invalid") from error
    expected_paths = [str(target.resolve()) for target in targets]
    if (
        payload.get("schemaVersion") != 1
        or phase not in {"publishing", "committed"}
        or not isinstance(entries, list)
        or [entry.get("path") for entry in entries if isinstance(entry, dict)] != expected_paths
        or any(not isinstance(entry.get("existed"), bool) for entry in entries if isinstance(entry, dict))
        or len(entries) != len(targets)
    ):
        raise ImportFailure("import transaction journal does not match requested targets")

    changed_parents: set[Path] = set()
    for target, entry in reversed(list(zip(targets, entries, strict=True))):
        backup = backups[target]
        had_target = entry["existed"]
        if phase == "committed":
            if not (target.exists() or target.is_symlink()):
                raise ImportFailure("committed import target is missing")
            if backup.exists() or backup.is_symlink():
                changed_parents.add(target.parent)
            remove_path(backup)
        elif had_target and (backup.exists() or backup.is_symlink()):
            remove_path(target)
            os.replace(backup, target)
            changed_parents.add(target.parent)
        elif had_target and not (target.exists() or target.is_symlink()):
            raise ImportFailure("original import target and backup are both missing")
        elif not had_target:
            if target.exists() or target.is_symlink() or backup.exists() or backup.is_symlink():
                changed_parents.add(target.parent)
            remove_path(target)
            remove_path(backup)

    for parent in sorted(changed_parents):
        fsync_directory(parent)
    remove_path(journal)
    remove_path(temporary)
    fsync_directory(journal.parent)


def transactional_replace(pairs: list[tuple[Path, Path]]) -> None:
    """Publish all targets with durable crash recovery and rollback."""
    targets = [target for _, target in pairs]
    backups = {target: target.with_name(f".{target.name}.import-backup") for target in targets}
    recover_transaction(targets)
    existed = [target.exists() or target.is_symlink() for target in targets]
    journal = transaction_journal(targets)
    for target in targets:
        target.parent.mkdir(parents=True, exist_ok=True)
    write_transaction_journal(targets, existed, "publishing")
    try:
        for (staged, target), had_target in zip(pairs, existed, strict=True):
            backup = backups[target]
            if had_target:
                os.replace(target, backup)
                fsync_directory_chain(target.parent, journal.parent)
            os.replace(staged, target)
            fsync_directory(staged.parent)
            fsync_directory_chain(target.parent, journal.parent)
        write_transaction_journal(targets, existed, "committed")
    except OSError as error:
        recover_transaction(targets)
        raise ImportFailure("could not publish staged import") from error

    # Cleanup is intentionally after the durable committed marker. If cleanup
    # is interrupted, recovery keeps the new targets and removes stale backups.
    cleanup_parents: set[Path] = set()
    for target, had_target in zip(targets, existed, strict=True):
        if had_target:
            remove_path(backups[target])
            cleanup_parents.add(target.parent)
    for parent in sorted(cleanup_parents):
        fsync_directory(parent)
    journal = transaction_journal(targets)
    remove_path(journal)
    fsync_directory(journal.parent)


def run(args: argparse.Namespace) -> None:
    if args.workers < 1 or args.workers > 32:
        raise ImportFailure("workers must be between 1 and 32")
    output_root = args.output_root.resolve()
    source_url = catalog_url(args)
    parsed_source = urllib.parse.urlsplit(source_url)
    catalog_hosts = {parsed_source.hostname} if parsed_source.hostname else set()
    raw = fetch_bytes(
        source_url,
        args.timeout,
        args.retries,
        50 * 1024 * 1024,
        allowed_hosts=catalog_hosts,
        allow_file=True,
    )
    records = extract_records(raw)
    slugs = assign_slugs(records)

    with tempfile.TemporaryDirectory(prefix=".web3logo-import-", dir=output_root) as temp:
        stage = Path(temp)
        stage_assets = stage / "logos"
        tasks: list[tuple[int, str, int, dict[str, Any]]] = []
        by_logo: dict[int, list[dict[str, Any]]] = {}
        asset_exclusions: list[dict[str, Any]] = []
        metadata_exclusions: list[dict[str, Any]] = []
        logo_exclusions: list[dict[str, Any]] = []
        for record in records:
            logo_id = integer(record["id"], "logo id")
            assets = record.get("logo")
            if not isinstance(assets, list) or not assets:
                raise ImportFailure(f"logo {logo_id} has no active assets")
            asset_ids: set[int] = set()
            for index, asset in enumerate(assets):
                if not isinstance(asset, dict):
                    raise ImportFailure(f"logo {logo_id} has an invalid asset")
                asset_id = integer(asset.get("id"), "asset id")
                if asset_id in asset_ids:
                    raise ImportFailure(f"logo {logo_id} has duplicate asset ID {asset_id}")
                asset_ids.add(asset_id)
                tasks.append((logo_id, slugs[logo_id], index, asset))

        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = [pool.submit(asset_job, task, stage_assets, args) for task in tasks]
            for future in concurrent.futures.as_completed(futures):
                logo_id, asset, exclusion = future.result()
                if asset is not None:
                    by_logo.setdefault(logo_id, []).append(asset)
                if exclusion is not None:
                    asset_exclusions.append(exclusion)

        logos: list[dict[str, Any]] = []
        id_map: list[dict[str, Any]] = []
        for record in sorted(records, key=lambda item: (slugs[integer(item["id"], "logo id")], integer(item["id"], "logo id"))):
            logo_id = integer(record["id"], "logo id")
            name = text(record.get("logoName"), "logo name", required=True)
            category = text(record.get("logoType"), "category") or "Other"
            if category not in ALLOWED_CATEGORIES:
                category = "Other"
            website = text(record.get("website"), "website")
            if website and urllib.parse.urlparse(website).scheme != "https":
                metadata_exclusions.append(
                    {
                        "legacyLogoId": logo_id,
                        "field": "website",
                        "sourceValue": website,
                        "reason": "non-https-url-omitted",
                    }
                )
                website = ""
            slug = slugs[logo_id]
            assets = sorted(by_logo.get(logo_id, []), key=lambda asset: asset["legacyId"])
            id_map.append(
                {
                    "legacyId": logo_id,
                    "name": name,
                    "slug": slug,
                    "legacyPath": f"/detail/{urllib.parse.quote(name, safe='')}/{logo_id}",
                    "status": "published" if assets else "excluded",
                    "targetPath": f"/logos/{slug}/" if assets else "/legacy-unavailable/",
                }
            )
            if not assets:
                logo_exclusions.append(
                    {
                        "legacyLogoId": logo_id,
                        "name": name,
                        "slug": slug,
                        "reason": "no-publishable-assets",
                    }
                )
                continue
            logos.append(
                {
                    "legacyId": logo_id,
                    "name": name,
                    "slug": slug,
                    "category": category,
                    "website": website or None,
                    "aliases": [],
                    "license": "Trademark and usage rights remain with the project owner.",
                    "verification": "Imported from the active legacy catalog.",
                    "assets": assets,
                }
            )

        catalog = {"schemaVersion": 1, "logos": logos}
        mapping = {"schemaVersion": 1, "logos": id_map}
        exclusions = {
            "schemaVersion": 1,
            "assets": sorted(asset_exclusions, key=lambda item: (item["legacyLogoId"], item["legacyAssetId"])),
            "metadata": sorted(metadata_exclusions, key=lambda item: (item["legacyLogoId"], item["field"])),
            "logos": sorted(logo_exclusions, key=lambda item: item["legacyLogoId"]),
        }
        staged_migration = stage / "migration"
        staged_data = stage / "src" / "data"
        staged_migration.mkdir(parents=True, exist_ok=True)
        staged_data.mkdir(parents=True, exist_ok=True)
        staged_raw = staged_migration / "legacy-active-export.json"
        staged_map = staged_migration / "legacy-id-map.json"
        staged_exclusions = staged_migration / "legacy-exclusions.json"
        staged_catalog = staged_data / "logos.json"
        staged_raw.write_bytes(raw)
        staged_map.write_bytes(stable_json(mapping))
        staged_exclusions.write_bytes(stable_json(exclusions))
        staged_catalog.write_bytes(stable_json(catalog))
        fsync_tree(stage)

        transactional_replace(
            [
                (staged_raw, output_root / "migration" / "legacy-active-export.json"),
                (staged_map, output_root / "migration" / "legacy-id-map.json"),
                (staged_exclusions, output_root / "migration" / "legacy-exclusions.json"),
                (staged_catalog, output_root / "src" / "data" / "logos.json"),
                (stage_assets, output_root / "public" / "logos"),
            ]
        )

    print(
        f"Imported {len(logos)} logos and {sum(len(logo['assets']) for logo in logos)} assets; "
        f"documented {len(logo_exclusions)} logo, {len(asset_exclusions)} asset, and "
        f"{len(metadata_exclusions)} metadata exclusions."
    )


def main() -> int:
    try:
        run(parse_args())
    except ImportFailure:
        print(
            "Import failed validation or download checks; no catalog was produced.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
