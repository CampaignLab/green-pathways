import anthropic
from chalice import Chalice, Response
from dotenv import load_dotenv
import os
from openai import OpenAI
from chalicelib.prompt import GREENPAPER_PROMPT, MP_PROMPT
import uuid
import logging
import requests
import csv
from jinja2 import Template
import json
import re

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "eu-west-2")
if not os.getenv("OPENAI_API_KEY"):
    raise Exception("OPENAI_API_KEY not set in environment")
if not os.getenv("ANTHROPIC_API_KEY"):
    raise Exception("ANTHROPIC_API_KEY not set in environment")

app = Chalice(app_name="green-pathways-backend")
app.log.setLevel(logging.INFO)

openai_client = OpenAI()
anthropic_client = anthropic.Anthropic()
os.makedirs("/tmp/audio", exist_ok=True)
SUPPORTED_CONTENT_TYPES = ["audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "application/octet-stream"]

# Load MP data at application startup and create a lookup dictionary
mp_dict = {}
with open('chalicelib/mpemails.csv', 'r') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        constituency = row.get('Constituency', '').strip()
        email = row.get('Email', '').strip()
        name = row.get('Name', '').strip()

        if constituency and email:
            mp_dict[constituency] = { "email": email, "name": name }

app.log.info(f"Loaded {len(mp_dict)} MP records")

@app.route("/email", methods=["GET"], cors=True)
def email():
    try:
        # Get postcode from query parameter
        postcode = app.current_request.query_params.get('postcode')
        if not postcode:
            return Response(
                body={"error": "No postcode provided"},
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Clean the postcode (remove spaces and convert to uppercase)
        postcode = postcode.strip().upper().replace(" ", "")
        
        # Get parliamentary constituency from postcodes.io
        response = requests.get(f"https://api.postcodes.io/postcodes/{postcode}")
        if response.status_code != 200:
            return Response(
                body={"error": f"Error fetching constituency data: {response.json().get('error', 'Unknown error')}"},
                status_code=response.status_code,
                headers={"Content-Type": "application/json"}
            )
        
        data = response.json()
        constituency = data.get('result', {}).get('parliamentary_constituency')
        
        if not constituency:
            return Response(
                body={"error": "Could not determine parliamentary constituency for this postcode"},
                status_code=404,
                headers={"Content-Type": "application/json"}
            )
        
        constituency = constituency.strip()
        mp_email = mp_dict.get(constituency).get("email")
        mp_name = mp_dict.get(constituency).get("name")
        
        if not mp_email:
            return Response(
                body={"error": f"No MP email found for constituency: {constituency}"},
                status_code=404,
                headers={"Content-Type": "application/json"}
            )
        
        return Response(
            body={
                "email": mp_email,
                "name": mp_name
            },
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
        
    except Exception as e:
        app.log.error(e)
        return Response(
            body={"error": str(e)},
            status_code=500,
            headers={"Content-Type": "application/json"}
        )
    

@app.route("/transcribe", methods=["POST"], cors=True, content_types=SUPPORTED_CONTENT_TYPES)
def transcribe():
    submission_id = str(uuid.uuid4())
    audio_file = app.current_request.raw_body
    content_type = app.current_request.headers.get('content-type', 'audio/webm')
    extension = content_type.split('/')[-1]
    temp_file_path = f"/tmp/audio/{submission_id}.{extension}"

    try:
        app.log.info(f"{submission_id}: Got data - {len(audio_file)/1024} kb")

        # Write audio data to temporary file
        with open(temp_file_path, "wb") as f:
            f.write(audio_file)
        
        # Process with Whisper API
        with open(temp_file_path, "rb") as audio_temp:
            app.log.info(f"{submission_id}: Contacting OpenAI")
            try:
                transcription = openai_client.audio.transcriptions.create(
                    model="gpt-4o-transcribe", 
                    file=audio_temp
                )
            except Exception as api_error:
                app.log.info(f"{submission_id}: OpenAI error - {str(api_error)}")
                raise api_error
        app.log.info(f"{submission_id}: Transcript received")
        transcription_text = transcription.text.strip()

        return transcription_text
    except Exception as e:
        app.log.error(e)
        return Response(
            body={"error": str(e)},
            status_code=500
        )
    finally:
        # Clean up the temporary file
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except Exception as e:
            app.log.info(f"{submission_id}: Warning: Failed to clean up temporary file {temp_file_path}: {str(e)}")

GREENPAPER_TEMPLATE = Template(GREENPAPER_PROMPT)
MPEMAIL_TEMPLATE = Template(MP_PROMPT)

@app.route("/greenpaper", methods=["POST"], cors=True)
def greenpaper():
   return apply_prompt_to_transcript(GREENPAPER_TEMPLATE)

@app.route("/mpemail", methods=["POST"], cors=True)
def mpemail():
    return apply_prompt_to_transcript(MPEMAIL_TEMPLATE)

def extract_json_from_response(response_text):
    # Try to find JSON in markdown code blocks first
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))

    # If no code blocks, try to find JSON directly
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(0))

    # If all else fails, try parsing the whole thing
    return json.loads(response_text)

def apply_prompt_to_transcript(template):
    template_id = str(uuid.uuid4())
    try:
        request_body = app.current_request.json_body
        transcript = request_body.get('transcript')
        name = request_body.get('name', 'Concerned Citizen')
        mp_name = request_body.get("mp_name", "")
        postcode = request_body.get("postcode", "")
        if not transcript:
            app.log.info(f"{template_id}: Transcript missing")
            return Response(
                body={"error": "Transcript required"},
                status_code=400
            )
        app.log.info(f"{template_id}: Got transcript length {len(transcript)}")

        params = { "TRANSCRIPT": transcript, "NAME": name, "MP_NAME": mp_name, "POSTCODE": postcode}
        message_content = template.render(**params)
        app.log.info(f"{template_id}: Template applied")

        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8192,
            temperature=0.6,
            messages=[
                {
                    "role": "user",
                    "content": message_content
                },
            ]
        )
        app.log.info(f"{template_id}: Got response from Claude")
        response_text = response.content[0].text.strip()
        try:
            json_data = extract_json_from_response(response_text)
            app.log.info(f"{template_id}: Response from Claude OK")
            return Response(
                body=json_data,
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        except json.JSONDecodeError:
            app.log.info(f"JSONDecodeError: {response_text}")
            return response_text
    except Exception as e:
        app.log.error(f"{template_id}: Error: {str(e)}")
        return Response(
            status_code=500,
            body={"error": str(e)},
            headers={"Content-Type": "application/json"}
        )

