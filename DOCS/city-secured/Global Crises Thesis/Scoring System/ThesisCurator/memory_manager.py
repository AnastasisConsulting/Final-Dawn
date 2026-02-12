import os
import json
import shutil
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

# Define files and directories
SHORT_TERM_MEMORY_FILE = "session_memory.json"
LONG_TERM_MEMORY_FILE = "long_term_memory.json"
MEMORY_VERSION_DIR = "memory_versions"
CHANGELOG_SIZE = 5  # Last 5 entries in the changelog


# Load memory from file
def load_memory(memory_file):
    if os.path.exists(memory_file):
        with open(memory_file, "r") as f:
            return json.load(f)
    return []


# Save memory to file
def save_memory(memory_file, memory):
    with open(memory_file, "w") as f:
        json.dump(memory, f, indent=4)


# Rotate long-term memory when it's full
def rotate_memory():
    version_files = [f for f in os.listdir(MEMORY_VERSION_DIR) if f.startswith("memory_v")]
    version_num = len(version_files) + 1
    new_version_file = os.path.join(MEMORY_VERSION_DIR, f"memory_v{version_num}.json")
    
    shutil.move(LONG_TERM_MEMORY_FILE, new_version_file)
    print(f"Memory rotated. Archived to {new_version_file}")
    return new_version_file


# Generate a changelog for the last N interactions
def generate_changelog(last_memory):
    prompt = "\n".join([f"{entry['role']}: {entry['content']}" for entry in last_memory])
    prompt += "\nPlease summarize the key points from this conversation."

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        n=1,
        temperature=0.7,
    )

    summary = response.choices[0].message.content
    return summary


def chat_with_gpt(prompt, short_term_memory, loaded_json_data=None):
    memory_text = "\n".join([f"{entry['role']}: {entry['content']}" for entry in short_term_memory])

    # If the JSON data is loaded, include it in the prompt
    if loaded_json_data:
        json_context = json.dumps(loaded_json_data, indent=4)
        full_prompt = f"Context: {json_context}\n\nMemory:\n{memory_text}\n\nUser: {prompt}\nAssistant:"
    else:
        full_prompt = f"Memory:\n{memory_text}\n\nUser: {prompt}\nAssistant:"

    # Call the GPT API
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": full_prompt}],
            max_tokens=150,
            n=1,
            temperature=0.7,
        )

        reply = response.choices[0].message.content
        return reply

    except Exception as e:
        raise RuntimeError(f"An error occurred while communicating with GPT: {str(e)}")
