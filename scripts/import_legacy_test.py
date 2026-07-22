import argparse
import importlib.util
import socket
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SPEC = importlib.util.spec_from_file_location(
    "import_legacy", Path(__file__).with_name("import-legacy.py")
)
IMPORTER = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(IMPORTER)


class ImporterTests(unittest.TestCase):
    def test_detects_formats_from_bytes(self):
        self.assertEqual(IMPORTER.identify_format(b"\x89PNG\r\n\x1a\nrest")[0], "png")
        self.assertEqual(IMPORTER.identify_format(b"\xff\xd8\xff\xe0rest")[0], "jpg")
        self.assertEqual(IMPORTER.identify_format(b"RIFF0000WEBPrest")[0], "webp")
        self.assertEqual(IMPORTER.identify_format(b"<svg xmlns='http://www.w3.org/2000/svg'/>")[0], "svg")
        self.assertEqual(IMPORTER.identify_format(b"<!-- source --><svg/>")[0], "svg")

    def test_rejects_unsupported_format_with_distinct_error(self):
        with self.assertRaises(IMPORTER.UnsupportedFormat):
            IMPORTER.identify_format(b"%!PS-Adobe-3.0")

    def test_slug_collisions_use_legacy_id(self):
        records = [
            {"id": 20, "logoName": "ETH Panda"},
            {"id": 10, "logoName": "ETH-Panda"},
            {"id": 30, "logoName": "熊猫"},
        ]
        self.assertEqual(
            IMPORTER.assign_slugs(records),
            {10: "eth-panda", 20: "eth-panda-20", 30: "logo-30"},
        )

    def test_rejects_unsafe_svg(self):
        unsafe = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        with self.assertRaises(IMPORTER.ImportFailure):
            IMPORTER.sanitize_svg(unsafe)

    def test_rejects_external_svg_reference(self):
        unsafe = b'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/a.png"/></svg>'
        with self.assertRaises(IMPORTER.ImportFailure):
            IMPORTER.sanitize_svg(unsafe)

        stylesheet = b'<?xml-stylesheet href="https://example.com/a.css"?><svg xmlns="http://www.w3.org/2000/svg"/>'
        with self.assertRaises(IMPORTER.ImportFailure):
            IMPORTER.sanitize_svg(stylesheet)

    def test_allows_quoted_local_css_reference_and_removes_comments(self):
        safe = b'''<svg xmlns="http://www.w3.org/2000/svg"><!-- note --><style>.a{fill:url('#paint')}</style><path class="a"/></svg>'''
        sanitized = IMPORTER.sanitize_svg(safe)
        self.assertNotIn(b"note", sanitized)
        self.assertIn(b"url('#paint')", sanitized)

    def test_catalog_allows_legacy_total_to_include_inactive_names(self):
        raw = b'{"data":[{"id":1,"logoName":"One"}],"total":2}'
        self.assertEqual(len(IMPORTER.extract_records(raw)), 1)

    def test_catalog_rejects_total_smaller_than_visible_records(self):
        raw = b'{"data":[{"id":1,"logoName":"One"},{"id":2,"logoName":"Two"}],"total":1}'
        with self.assertRaises(IMPORTER.ImportFailure):
            IMPORTER.extract_records(raw)

    def test_transactional_replace_rolls_back_every_target(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            targets = [root / "first.json", root / "second.json"]
            staged = [root / "first.new", root / "second.new"]
            for index, target in enumerate(targets):
                target.write_text(f"old-{index}")
                staged[index].write_text(f"new-{index}")

            real_replace = IMPORTER.os.replace
            def fail_second_publish(source, destination):
                if Path(source) == staged[1] and Path(destination) == targets[1]:
                    raise OSError("simulated publication failure")
                return real_replace(source, destination)

            with mock.patch.object(IMPORTER.os, "replace", side_effect=fail_second_publish):
                with self.assertRaises(IMPORTER.ImportFailure):
                    IMPORTER.transactional_replace(list(zip(staged, targets)))

            self.assertEqual([target.read_text() for target in targets], ["old-0", "old-1"])
            self.assertFalse(any(root.glob(".*.import-backup")))

    def test_crash_recovery_removes_targets_that_were_initially_absent(self):
        class SimulatedCrash(BaseException):
            pass

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            targets = [root / "initially-absent.json", root / "existing.json"]
            staged = [root / "absent.new", root / "existing.new"]
            targets[1].write_text("old-existing")
            staged[0].write_text("new-absent")
            staged[1].write_text("new-existing")
            real_replace = IMPORTER.os.replace

            def crash_during_second_publish(source, destination):
                if Path(source) == staged[1] and Path(destination) == targets[1]:
                    raise SimulatedCrash()
                return real_replace(source, destination)

            with mock.patch.object(IMPORTER.os, "replace", side_effect=crash_during_second_publish):
                with self.assertRaises(SimulatedCrash):
                    IMPORTER.transactional_replace(list(zip(staged, targets)))

            IMPORTER.recover_transaction(targets)
            self.assertFalse(targets[0].exists())
            self.assertEqual(targets[1].read_text(), "old-existing")
            self.assertFalse((root / ".web3logo-import-transaction.json").exists())

    def test_committed_recovery_keeps_new_targets_after_cleanup_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            targets = [root / "first.json", root / "second.json"]
            staged = [root / "first.new", root / "second.new"]
            for index, target in enumerate(targets):
                target.write_text(f"old-{index}")
                staged[index].write_text(f"new-{index}")

            real_remove = IMPORTER.remove_path
            failed = False

            def fail_first_backup_cleanup(path):
                nonlocal failed
                if not failed and str(path).endswith(".import-backup"):
                    failed = True
                    raise OSError("simulated cleanup failure")
                return real_remove(path)

            with mock.patch.object(IMPORTER, "remove_path", side_effect=fail_first_backup_cleanup):
                with self.assertRaises(OSError):
                    IMPORTER.transactional_replace(list(zip(staged, targets)))

            IMPORTER.recover_transaction(targets)
            self.assertEqual([target.read_text() for target in targets], ["new-0", "new-1"])
            self.assertFalse(any(root.glob(".*.import-backup")))
            self.assertFalse((root / ".web3logo-import-transaction.json").exists())

    def test_transaction_fsyncs_each_target_parent_before_commit_and_journal_removal(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target_parents = [root / "migration", root / "src" / "data", root / "public"]
            targets = [target_parents[0] / "one.json", target_parents[1] / "two.json", target_parents[2] / "logos"]
            staged = [root / "stage-one.json", root / "stage-two.json", root / "stage-logos"]
            for index, target in enumerate(targets[:2]):
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(f"old-{index}")
                staged[index].write_text(f"new-{index}")
            targets[2].mkdir(parents=True)
            (targets[2] / "old.svg").write_text("old")
            staged[2].mkdir()
            (staged[2] / "new.svg").write_text("new")

            events = []
            real_fsync_directory = IMPORTER.fsync_directory
            real_write_journal = IMPORTER.write_transaction_journal
            real_remove_path = IMPORTER.remove_path
            real_replace = IMPORTER.os.replace

            def record_fsync(path):
                events.append(("fsync", Path(path).resolve()))
                return real_fsync_directory(path)

            def record_journal(target_list, existed, phase):
                events.append(("journal", phase))
                return real_write_journal(target_list, existed, phase)

            def record_remove(path):
                if Path(path).name == ".web3logo-import-transaction.json":
                    events.append(("remove", "journal"))
                return real_remove_path(path)

            def record_replace(source, destination):
                events.append(("replace", Path(source).resolve(), Path(destination).resolve()))
                return real_replace(source, destination)

            with (
                mock.patch.object(IMPORTER, "fsync_directory", side_effect=record_fsync),
                mock.patch.object(IMPORTER, "write_transaction_journal", side_effect=record_journal),
                mock.patch.object(IMPORTER, "remove_path", side_effect=record_remove),
                mock.patch.object(IMPORTER.os, "replace", side_effect=record_replace),
            ):
                IMPORTER.transactional_replace(list(zip(staged, targets)))

            committed = events.index(("journal", "committed"))
            journal_removed = events.index(("remove", "journal"))
            for parent in target_parents:
                parent_event = ("fsync", parent.resolve())
                self.assertTrue(any(event == parent_event for event in events[:committed]))
                self.assertTrue(any(event == parent_event for event in events[committed + 1 : journal_removed]))
            for staged_path, target in zip(staged, targets, strict=True):
                backup = target.with_name(f".{target.name}.import-backup")
                backup_rename = events.index(("replace", target.resolve(), backup.resolve()))
                publish_rename = events.index(("replace", staged_path.resolve(), target.resolve()))
                self.assertIn(
                    ("fsync", target.parent.resolve()),
                    events[backup_rename + 1 : publish_rename],
                )

    def test_fsync_tree_syncs_staged_files_and_directories(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            nested = root / "logos" / "example"
            nested.mkdir(parents=True)
            asset = nested / "1.svg"
            asset.write_text("<svg/>")
            synced_files = []
            synced_directories = []
            real_fsync_file = IMPORTER.fsync_file
            real_fsync_directory = IMPORTER.fsync_directory

            def record_file(path):
                synced_files.append(Path(path).resolve())
                return real_fsync_file(path)

            def record_directory(path):
                synced_directories.append(Path(path).resolve())
                return real_fsync_directory(path)

            with (
                mock.patch.object(IMPORTER, "fsync_file", side_effect=record_file),
                mock.patch.object(IMPORTER, "fsync_directory", side_effect=record_directory),
            ):
                IMPORTER.fsync_tree(root)

            self.assertEqual(synced_files, [asset.resolve()])
            self.assertEqual(
                set(synced_directories),
                {nested.resolve(), nested.parent.resolve(), root.resolve()},
            )

    def test_remote_url_policy_rejects_scheme_downgrade_and_private_addresses(self):
        allowed = {"cdn.lxdao.io"}
        with self.assertRaises(IMPORTER.UnsafeURL):
            IMPORTER.validate_remote_url("http://cdn.lxdao.io/logo.svg", allowed)
        with self.assertRaises(IMPORTER.UnsafeURL):
            IMPORTER.validate_remote_url("https://127.0.0.1/logo.svg", {"127.0.0.1"})

        private_dns = [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.8", 443))]
        with mock.patch.object(IMPORTER.socket, "getaddrinfo", return_value=private_dns):
            with self.assertRaises(IMPORTER.UnsafeURL):
                IMPORTER.validate_remote_url("https://cdn.lxdao.io/logo.svg", allowed)

    def test_asset_job_records_unsafe_url_as_an_exclusion(self):
        args = argparse.Namespace(timeout=1, retries=0, max_bytes=1024)
        source = {
            "id": 9,
            "file": "https://cdn.lxdao.io/logo.svg",
            "fileName": "logo.svg",
        }
        with tempfile.TemporaryDirectory() as directory:
            with mock.patch.object(IMPORTER, "fetch_bytes", side_effect=IMPORTER.UnsafeURL("blocked")):
                _, asset, exclusion = IMPORTER.asset_job(
                    (1, "example", 0, source),
                    Path(directory),
                    args,
                )
        self.assertIsNone(asset)
        self.assertEqual(exclusion["reason"], "unsafe-url")

        source["file"] = "http://127.0.0.1/private"
        with tempfile.TemporaryDirectory() as directory:
            _, asset, exclusion = IMPORTER.asset_job(
                (1, "example", 0, source),
                Path(directory),
                args,
            )
        self.assertIsNone(asset)
        self.assertEqual(exclusion["sourceUrl"], "http://127.0.0.1/private")
        self.assertEqual(exclusion["reason"], "unsafe-url")

    def test_remote_url_policy_rejects_redirects_and_private_connected_peers(self):
        allowed = {"cdn.lxdao.io"}
        public_dns = [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("104.18.0.1", 443))]

        redirect_response = mock.Mock(status=302, reason="Found", headers={"Location": "http://127.0.0.1/"})
        redirect_connection = mock.Mock()
        redirect_connection.sock.getpeername.return_value = ("104.18.0.1", 443)
        redirect_connection.getresponse.return_value = redirect_response
        with (
            mock.patch.object(IMPORTER.socket, "getaddrinfo", return_value=public_dns),
            mock.patch.object(IMPORTER.http.client, "HTTPSConnection", return_value=redirect_connection),
        ):
            with self.assertRaises(IMPORTER.UnsafeURL):
                IMPORTER.fetch_bytes(
                    "https://cdn.lxdao.io/logo.svg",
                    timeout=1,
                    retries=0,
                    max_bytes=1024,
                    allowed_hosts=allowed,
                )

        private_connection = mock.Mock()
        private_connection.sock.getpeername.return_value = ("169.254.169.254", 443)
        with (
            mock.patch.object(IMPORTER.socket, "getaddrinfo", return_value=public_dns),
            mock.patch.object(IMPORTER.http.client, "HTTPSConnection", return_value=private_connection),
        ):
            with self.assertRaises(IMPORTER.UnsafeURL):
                IMPORTER.fetch_bytes(
                    "https://cdn.lxdao.io/logo.svg",
                    timeout=1,
                    retries=0,
                    max_bytes=1024,
                    allowed_hosts=allowed,
                )
            private_connection.request.assert_not_called()


if __name__ == "__main__":
    unittest.main()
