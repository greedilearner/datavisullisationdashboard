import argparse
import re
from pathlib import Path
from typing import Iterable, List, Set

import pandas as pd
import requests


DEVANAGARI_TO_ASCII = str.maketrans("०१२३४५६७८९", "0123456789")


def normalize_dhara_text(value: object) -> str:
    """
    Normalize noisy धारा text.
    Examples:
    - 504ध्304 भादवि
    - 304(2), 317(2), बीएनएस
    """
    if pd.isna(value):
        return ""

    text = str(value).strip().translate(DEVANAGARI_TO_ASCII)
    text = text.replace("द्धध्", " ").replace("ध्", " ")
    text = re.sub(r"\(\s*\d+\s*\)", " ", text)  # remove (2), (1), etc.
    text = re.sub(r"[\u200b\u200c\u200d]", "", text)
    text = re.sub(r"[^0-9A-Za-z\u0900-\u097F,\s/]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_sections_and_laws(clean_text: str) -> tuple[Set[int], Set[str]]:
    numbers = {int(n) for n in re.findall(r"\b\d{1,4}\b", clean_text)}
    laws: Set[str] = set()
    low = clean_text.lower()
    if "भादवि" in clean_text or "ipc" in low:
        laws.add("भादवि")
    if "बीएनएस" in clean_text or "bns" in low:
        laws.add("बीएनएस")
    return numbers, laws


# NOTE:
# This mapping is seeded from your shared list image where legible.
# You can extend/adjust anytime without changing core logic.
CATEGORY_SECTION_MAP = {
    "चोरी": {378, 379, 380, 381, 382},
    "लूट": {390, 392, 393, 394, 397, 398},
    "डकैती": {395, 396, 399, 400, 402},
    "हत्या/हत्या का प्रयास": {299, 300, 302, 304, 305, 306, 307, 308},
    "धोखाधड़ी": {415, 416, 417, 418, 419, 420},
    "कूटकरण/जालसाजी": {463, 465, 466, 467, 468, 469, 471, 474},
    "महिला अपराध": {354,375,376},
    "गौकशी":{3,5},
    "आयुध अधि0":{25,27,29},
    "एनडीपीएस एक्ट":{8.20,21,22,23,25,27},
}
CATEGORY_SECTION_MAPP = {
    "चोरी": {303,304,305,306,307},
    "लूट": {309310,311,312,313,314,317},
    "डकैती": {312,313,314,315,316,318},
    "हत्या/हत्या का प्रयास": {101,102,103,104,106,80,108,109,110},
    "धोखाधड़ी": {318,319},
    "कूटकरण/जालसाजी": {335,336,337,338,339,340,341},
    "महिला अपराध": {74,75,76,77,78,63,64,66,68,70,71},
    
}


def detect_category(sections: Set[int], laws: Set[str]) -> str:
    if not sections and not laws:
        return "अज्ञात"

    matches: List[str] = []
    if "बीएनएस" in laws :
        for category, section_set in CATEGORY_SECTION_MAPP.items():
            if sections & section_set:
                 matches.append(category)
    elif "भादवि" in laws:
        for category, section_set in CATEGORY_SECTION_MAP.items():
            if sections & section_set:
                matches.append(category)

    # Optional law hint when section-based match is unavailable.
    if not matches and "आयुध अधि0" in laws:
        return "आयुध अधि0"
    if not matches and "एनडीपीएस एक्ट" in laws:
        return "एनडीपीएस एक्ट"
    if not matches:
        return "अज्ञात"

    return ", ".join(sorted(set(matches)))


def process_dataframe(df: pd.DataFrame, dhara_column: str = "धारा") -> pd.DataFrame:
    if dhara_column not in df.columns:
        raise ValueError(f"Column '{dhara_column}' not found. Available: {list(df.columns)}")

    out = df.copy()
    out["धारा_साफ"] = out[dhara_column].apply(normalize_dhara_text)
    parsed = out["धारा_साफ"].apply(extract_sections_and_laws)
    out["section_numbers"] = parsed.apply(lambda x: ",".join(map(str, sorted(x[0]))))
    out["law_hint"] = parsed.apply(lambda x: ",".join(sorted(x[1])) if x[1] else "")
    out["crime_category"] = parsed.apply(lambda x: detect_category(x[0], x[1]))
    return out


def iter_target_files(folder: Path, prefix: str) -> Iterable[Path]:
    for p in folder.iterdir():
        if p.is_file() and p.name.startswith(prefix) and p.suffix.lower() in {".csv", ".xlsx", ".xls"}:
            yield p


def read_table(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    return pd.read_excel(path)


def write_table(path: Path, df: pd.DataFrame) -> None:
    if path.suffix.lower() == ".csv":
        df.to_csv(path, index=False, encoding="utf-8-sig")
    else:
        df.to_excel(path, index=False)


def parse_path_values(value: object) -> List[str]:
    if pd.isna(value):
        return []
    text = str(value).strip()
    if not text:
        return []
    # Support comma/semicolon/newline separated object paths.
    parts = re.split(r"[,\n;]+", text)
    return [p.strip() for p in parts if p.strip()]


def delete_from_supabase(
    *,
    url: str,
    service_role_key: str,
    bucket: str,
    object_paths: List[str],
) -> dict:
    """
    Delete objects from Supabase Storage using remove endpoint.
    """
    endpoint = f"{url.rstrip('/')}/storage/v1/object/remove"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }
    payload = {"bucketId": bucket, "prefixes": object_paths}
    response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    return response.json() if response.text else {"ok": True}


def delete_from_cloudflare_r2(
    *,
    account_id: str,
    access_key_id: str,
    secret_access_key: str,
    bucket: str,
    object_paths: List[str],
) -> None:
    """
    Delete objects from Cloudflare R2 (S3-compatible) via boto3.
    """
    try:
        import boto3
    except ImportError as exc:
        raise RuntimeError(
            "boto3 is required for Cloudflare R2 delete. Install with: pip install boto3"
        ) from exc

    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
    )
    # Delete in chunks of 1000 objects (S3 API limit)
    for i in range(0, len(object_paths), 1000):
        chunk = object_paths[i : i + 1000]
        s3.delete_objects(
            Bucket=bucket,
            Delete={"Objects": [{"Key": key} for key in chunk], "Quiet": True},
        )


def run_remote_delete(
    df: pd.DataFrame,
    *,
    remote_path_column: str,
    supabase_enabled: bool,
    supabase_url: str,
    supabase_service_role_key: str,
    supabase_bucket: str,
    cloudflare_enabled: bool,
    cloudflare_account_id: str,
    cloudflare_access_key_id: str,
    cloudflare_secret_access_key: str,
    cloudflare_bucket: str,
) -> None:
    if remote_path_column not in df.columns:
        raise ValueError(
            f"Remote delete requested but column '{remote_path_column}' not found. Available: {list(df.columns)}"
        )

    object_paths: List[str] = []
    for raw in df[remote_path_column].tolist():
        object_paths.extend(parse_path_values(raw))
    object_paths = sorted(set(object_paths))

    if not object_paths:
        print("Remote delete requested, but no paths found in column.")
        return

    if supabase_enabled:
        if not (supabase_url and supabase_service_role_key and supabase_bucket):
            raise ValueError("Supabase delete enabled but url/key/bucket is missing.")
        resp = delete_from_supabase(
            url=supabase_url,
            service_role_key=supabase_service_role_key,
            bucket=supabase_bucket,
            object_paths=object_paths,
        )
        print(f"Supabase delete done. Objects requested: {len(object_paths)}. Response: {resp}")

    if cloudflare_enabled:
        if not (
            cloudflare_account_id
            and cloudflare_access_key_id
            and cloudflare_secret_access_key
            and cloudflare_bucket
        ):
            raise ValueError("Cloudflare delete enabled but account/access/secret/bucket is missing.")
        delete_from_cloudflare_r2(
            account_id=cloudflare_account_id,
            access_key_id=cloudflare_access_key_id,
            secret_access_key=cloudflare_secret_access_key,
            bucket=cloudflare_bucket,
            object_paths=object_paths,
        )
        print(f"Cloudflare R2 delete done. Objects requested: {len(object_paths)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Auto-categorize crime category from धारा for files starting with a given prefix."
    )
    parser.add_argument("--folder", required=True, help="Folder containing source files")
    parser.add_argument("--prefix", default="जेल रिहाई वर्ष", help="Filename prefix to match")
    parser.add_argument("--dhara-column", default="धारा", help="Column name containing section text")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite source files; default writes *_categorized files",
    )
    parser.add_argument(
        "--delete-remote",
        action="store_true",
        help="Also delete remote objects listed in path column (Supabase/Cloudflare as enabled).",
    )
    parser.add_argument(
        "--remote-path-column",
        default="remote_path",
        help="Column that stores remote object path(s). Supports comma/semicolon/newline separated paths.",
    )
    parser.add_argument("--delete-supabase", action="store_true", help="Enable delete on Supabase Storage.")
    parser.add_argument("--supabase-url", default="", help="Supabase project URL.")
    parser.add_argument("--supabase-service-role-key", default="", help="Supabase service role key.")
    parser.add_argument("--supabase-bucket", default="", help="Supabase storage bucket.")
    parser.add_argument("--delete-cloudflare", action="store_true", help="Enable delete on Cloudflare R2.")
    parser.add_argument("--cloudflare-account-id", default="", help="Cloudflare account id.")
    parser.add_argument("--cloudflare-access-key-id", default="", help="Cloudflare R2 access key id.")
    parser.add_argument("--cloudflare-secret-access-key", default="", help="Cloudflare R2 secret access key.")
    parser.add_argument("--cloudflare-bucket", default="", help="Cloudflare R2 bucket.")
    args = parser.parse_args()

    folder = Path(args.folder)
    if not folder.exists() or not folder.is_dir():
        raise FileNotFoundError(f"Invalid folder: {folder}")

    files = list(iter_target_files(folder, args.prefix))
    if not files:
        print(f"No files found with prefix '{args.prefix}' in '{folder}'.")
        return

    for src in files:
        df = read_table(src)
        out_df = process_dataframe(df, dhara_column=args.dhara_column)
        if args.delete_remote:
            run_remote_delete(
                df=out_df,
                remote_path_column=args.remote_path_column,
                supabase_enabled=args.delete_supabase,
                supabase_url=args.supabase_url,
                supabase_service_role_key=args.supabase_service_role_key,
                supabase_bucket=args.supabase_bucket,
                cloudflare_enabled=args.delete_cloudflare,
                cloudflare_account_id=args.cloudflare_account_id,
                cloudflare_access_key_id=args.cloudflare_access_key_id,
                cloudflare_secret_access_key=args.cloudflare_secret_access_key,
                cloudflare_bucket=args.cloudflare_bucket,
            )
        dst = src if args.overwrite else src.with_name(f"{src.stem}_categorized{src.suffix}")
        write_table(dst, out_df)
        print(f"Processed: {src.name} -> {dst.name}")


if __name__ == "__main__":
    main()
