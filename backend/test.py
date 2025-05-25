from dotenv import load_dotenv
import json
import requests
import app
import sys
import os

load_dotenv()

BASE_URL=os.getenv("REMOTE_URL") if len(sys.argv) > 2 and sys.argv[2] == "remote" else "http://127.0.0.1:8000"

def test_pipeline(filename):
    response = requests.get(f'{BASE_URL}/email?postcode=CR0%207DJ')
    if response.status_code != 200:
        print(f"Email failed: {response.text}")
        return
    print("Email: ", response.text, "\n---\n")

    # 1. First, transcribe the audio
    with open(filename, "rb") as audio_file:
        data = audio_file.read()
        response = requests.post(f'{BASE_URL}/transcribe',
                                 data=data, headers={'Content-Type': 'audio/mp4'})
        if response.status_code != 200:
            print(f"Transcription failed: {response.text}")
            return
        transcript = response.text
        print("Transcript:", transcript)
        print("\n---\n")

    # 2. Get greenpaper response
    greenpaper_response = requests.post(
        f'{BASE_URL}/greenpaper',
        json={'transcript': transcript}
    )
    if greenpaper_response.status_code != 200:
        print(f"Greenpaper failed: {greenpaper_response.text}")
        return
    greenpaper_output = greenpaper_response.text
    print("Greenpaper Response:", greenpaper_output)
    print("\n---\n")

    # 3. Get MP email response
    mpemail_response = requests.post(
        f'{BASE_URL}/mpemail',
        json={'transcript': transcript}
    )
    if mpemail_response.status_code != 200:
        print(f"MP Email failed: {mpemail_response.text}")
        return
    mp_output = mpemail_response.text
    print("MP Email Response:", mp_output)

if __name__ == "__main__":
    test_pipeline(sys.argv[1])