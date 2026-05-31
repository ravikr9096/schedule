from fastapi import APIRouter, HTTPException
import httpx
import csv
import re
from io import StringIO
import os
from google.oauth2 import service_account
import google.auth.transport.requests
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly'
]
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'service_account.json')
SHEET_ID = "1Vh7qBWyRE5-kWxBEUnmB3-BKrH36gjAls9n-fL1v65I"

class MatchPayload(BaseModel):
    date: str
    slot: str
    ground: str
    team_a: str
    team_b: Optional[str] = None

def col_to_letter(col: int) -> str:
    letter = ''
    while col >= 0:
        letter = chr(col % 26 + 65) + letter
        col = col // 26 - 1
    return letter

def get_access_token():
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise HTTPException(status_code=500, detail="Service account credentials not found.")
    
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        request = google.auth.transport.requests.Request()
        creds.refresh(request)
        return creds.token
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@router.get("/api/gsheet")
async def read_google_sheet(gid: str = "0"):
    """
    Reads data from a private Google Sheet.
    Requires a valid service_account.json file and the sheet must be shared with the Service Account email.
    """
    token = get_access_token()

    # Endpoint to export a specific sheet (gid) as CSV
    # We append access_token to the URL because httpx drops the Authorization header
    # when following cross-domain redirects (docs.google.com -> googleusercontent.com)
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}&access_token={token}"

    headers = {"Authorization": f"Bearer {token}"}

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch Google Sheet: {exc}") from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Failed to fetch Google Sheet. Ensure the sheet is shared with the Service Account.") from exc

    reader = csv.reader(StringIO(response.text))
    data = list(reader)

    if len(data) < 2:
        return {}

    grounds = data[0]
    slots = data[1]
    matches_by_date = {}
    current_date = "Unknown Date"

    for row in data[2:]:
        if not row:
            continue
            
        # Assume the first column (index 0) contains the Date
        date_val = row[0].strip()
        if date_val:
            current_date = date_val
            
        if current_date not in matches_by_date:
            matches_by_date[current_date] = []

        # Iterate through cells starting from the 3rd column (index 2)
        for col_idx in range(2, len(row)):
            # Ensure we don't go out of bounds if the row has more columns than headers
            if col_idx >= len(grounds) or col_idx >= len(slots):
                continue
            
            ground = grounds[col_idx].strip()
            slot = slots[col_idx].strip()
            cell_value = row[col_idx].strip()

            # Skip empty cells or columns that do not have a ground/slot header (e.g., row label columns)
            if not cell_value or not ground or not slot:
                continue

            # Attempt to split "Team A vs Team B", "Team A v Team B", "Team A - Team B", or "Team A \n Team B"
            parts = re.split(r'\s+vs\.?\s+|\s+v\.?\s+|\s*-\s*|\n+', cell_value, maxsplit=1, flags=re.IGNORECASE)
            team_a = parts[0].strip() if len(parts) > 0 else ""
            team_b = parts[1].strip() if len(parts) > 1 else ""

            # Check if the teams are on consecutive rows instead of in the same cell
            existing_match = None
            if not team_b:
                # Search backwards for the most recent match in this ground/slot
                for match in reversed(matches_by_date[current_date]):
                    if match["ground"] == ground and match["slot"] == slot:
                        if not match["team_b"]:
                            existing_match = match
                        break
            
            if existing_match:
                existing_match["team_b"] = team_a
            else:
                matches_by_date[current_date].append({
                    "ground": ground,
                    "slot": slot,
                    "team_a": team_a,
                    "team_b": team_b
                })

    # Filter out dates that didn't have any valid matches
    return {k: v for k, v in matches_by_date.items() if v}


@router.post("/api/gsheet")
async def add_google_sheet_match(payload: MatchPayload, gid: str = "0"):
    """
    Adds a match to the Google Sheet under the specified date, slot, and ground.
    """
    token = get_access_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        # 1. Fetch metadata to get the exact Sheet Name corresponding to the `gid`
        meta_url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}"
        try:
            meta_res = await client.get(meta_url, headers=headers)
            meta_res.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=f"Failed to fetch sheet metadata: {exc.response.text}") from exc
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch sheet metadata: {e}")
        
        sheet_title = None
        for sheet in meta_res.json().get("sheets", []):
            if str(sheet["properties"]["sheetId"]) == gid:
                sheet_title = sheet["properties"]["title"]
                break
        
        if not sheet_title:
            raise HTTPException(status_code=404, detail="Sheet tab not found.")

        # 2. Fetch current data via CSV to find the correct row/col intersections
        csv_url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}&access_token={token}"
        try:
            csv_res = await client.get(csv_url, headers=headers)
            csv_res.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=f"Failed to fetch CSV data: {exc.response.text}") from exc
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch CSV data: {e}")
            
        reader = csv.reader(StringIO(csv_res.text))
        data = list(reader)

        if len(data) < 2:
            raise HTTPException(status_code=400, detail="Sheet is empty or malformed headers.")

        grounds = data[0]
        slots = data[1]

        col_idx = -1
        for i in range(2, max(len(grounds), len(slots))):
            g = grounds[i].strip() if i < len(grounds) else ""
            s = slots[i].strip() if i < len(slots) else ""
            if g == payload.ground and s == payload.slot:
                col_idx = i
                break

        if col_idx == -1:
            raise HTTPException(status_code=400, detail="Ground and Slot combination not found in sheet headers.")

        row_idx = -1
        empty_row_idx = -1
        current_date = ""
        for i in range(2, len(data)):
            r = data[i]
            d = r[0].strip() if len(r) > 0 else ""
            if d:
                current_date = d
            
            if current_date == payload.date:
                cell_val = r[col_idx].strip() if col_idx < len(r) else ""
                if cell_val:
                    # Data already exists, so we overwrite this cell
                    row_idx = i
                    break
                elif empty_row_idx == -1:
                    empty_row_idx = i
            elif current_date != payload.date and empty_row_idx != -1:
                # We moved past the target date, stop searching
                break

        needs_date = False
        if row_idx == -1:
            if empty_row_idx != -1:
                row_idx = empty_row_idx
            else:
                # If the date didn't exist at all, append to the bottom
                row_idx = len(data)
                needs_date = True

        # 3. Format values and trigger update
        row_values = [payload.team_a]
        if payload.team_b:
            row_values.append(payload.team_b)
        else:
            row_values.append("") # Clear the adjacent cell just in case

        updates = []
        if needs_date:
            updates.append({
                "range": f"'{sheet_title}'!A{row_idx + 1}",
                "values": [[payload.date]]
            })
        
        updates.append({
            "range": f"'{sheet_title}'!{col_to_letter(col_idx)}{row_idx + 1}",
            "values": [row_values]
        })

        update_url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values:batchUpdate"
        update_body = {
            "valueInputOption": "USER_ENTERED",
            "data": updates
        }

        try:
            update_res = await client.post(update_url, headers=headers, json=update_body)
            update_res.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=f"Failed to update Google Sheet: {exc.response.text}") from exc
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to update Google Sheet: {e}")

    return {
        "message": "Match added successfully", 
        "date": payload.date,
        "cell": f"{col_to_letter(col_idx)}{row_idx + 1}"
    }


@router.get("/api/gsheet/meta")
async def get_sheet_metadata(gid: str = "0"):
    """
    Fetches the unique list of grounds and slots from the Google Sheet.
    """
    token = get_access_token()
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}&access_token={token}"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=f"Failed to fetch CSV data: {exc.response.text}") from exc
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch CSV data: {e}")

    reader = csv.reader(StringIO(response.text))
    data = list(reader)

    if len(data) < 2:
        return {"grounds": [], "slots": []}

    grounds = data[0]
    slots = data[1]
    unique_grounds = []
    unique_slots = []

    for i in range(2, max(len(grounds), len(slots))):
        g = grounds[i].strip() if i < len(grounds) else ""
        s = slots[i].strip() if i < len(slots) else ""

        if g and g not in unique_grounds:
            unique_grounds.append(g)
        if s and s not in unique_slots:
            unique_slots.append(s)

    return {
        "grounds": unique_grounds,
        "slots": unique_slots
    }