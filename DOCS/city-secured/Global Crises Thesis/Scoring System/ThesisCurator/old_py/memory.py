import os
import json
import shutil
import tkinter as tk
from tkinter import filedialog, scrolledtext, messagebox
from openai import OpenAI
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

# Define files and directories
SHORT_TERM_MEMORY_FILE = "session_memory.json"
LONG_TERM_MEMORY_FILE = "long_term_memory.json"
MEMORY_VERSION_DIR = "memory_versions"
CHANGELOG_SIZE = 5  # Last 5 entries in the changelog

# Color schemes for light and dark modes
light_mode = {
    "bg": "white",
    "fg": "black",
    "text_bg": "white",
    "text_fg": "black",
    "button_bg": "lightgray",
    "button_fg": "black",
}

dark_mode = {
    "bg": "#2e2e2e",
    "fg": "white",
    "text_bg": "#3c3f41",
    "text_fg": "white",
    "button_bg": "#444",
    "button_fg": "white",
}

current_mode = light_mode  # Start with light mode by default

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

def chat_with_gpt(prompt, short_term_memory):
    global loaded_json_data  # Access the loaded JSON data

    # Convert short-term memory to a string for the prompt
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
        messagebox.showerror("Error", f"An error occurred while communicating with GPT: {str(e)}")
        return "Error: Could not retrieve a response from GPT."


# Store a highlighted portion to short-term memory
def store_in_short_memory():
    dialog_box.focus()  # Ensure the focus is on the dialog_box to keep selection active
    try:
        highlighted_text = dialog_box.get(tk.SEL_FIRST, tk.SEL_LAST)
        if highlighted_text:
            short_term_memory.append({"role": "highlight", "content": highlighted_text})
            update_short_term_display()
    except tk.TclError:
        messagebox.showwarning("No Selection", "Please select a portion of text to store in short-term memory.")

# Store a highlighted portion to long-term memory
def store_in_long_memory():
    dialog_box.focus()  # Ensure the focus is on the dialog_box to keep selection active
    try:
        highlighted_text = dialog_box.get(tk.SEL_FIRST, tk.SEL_LAST)
        if highlighted_text:
            long_term_memory.append({"role": "highlight", "content": highlighted_text})
            save_memory(LONG_TERM_MEMORY_FILE, long_term_memory)
            messagebox.showinfo("Memory Stored", "Highlighted text saved to long-term memory.")
    except tk.TclError:
        messagebox.showwarning("No Selection", "Please select a portion of text to store in long-term memory.")


# Toggle between light and dark modes
def toggle_mode():
    global current_mode
    if current_mode == light_mode:
        current_mode = dark_mode
    else:
        current_mode = light_mode
    apply_mode()

# Apply the current mode's color scheme
def apply_mode():
    window.config(bg=current_mode["bg"])
    dialog_box.config(bg=current_mode["text_bg"], fg=current_mode["text_fg"])
    user_input.config(bg=current_mode["text_bg"], fg=current_mode["text_fg"])
    short_term_box.config(bg=current_mode["text_bg"], fg=current_mode["text_fg"])
    
    file_button.config(bg=current_mode["button_bg"], fg=current_mode["button_fg"])
    archive_button.config(bg=current_mode["button_bg"], fg=current_mode["button_fg"])
    long_btn.config(bg=current_mode["button_bg"], fg=current_mode["button_fg"])
    short_btn.config(bg=current_mode["button_bg"], fg=current_mode["button_fg"])
    send_btn.config(bg=current_mode["button_bg"], fg=current_mode["button_fg"])
    toggle_btn.config(bg=current_mode["button_bg"], fg=current_mode["button_fg"])

# Global variable to store the loaded JSON data
loaded_json_data = None

def load_file():
    global loaded_json_data  # Use a global variable to hold the loaded JSON data
    file_path = filedialog.askopenfilename(filetypes=[("JSON files", "*.json")])
    if file_path:
        try:
            # Load the content of the JSON file into the global variable
            with open(file_path, "r") as file:
                loaded_json_data = json.load(file)

            # Optionally display the JSON content in the dialog box
            dialog_box.insert(tk.END, f"Loaded file: {file_path}\n")
            dialog_box.insert(tk.END, json.dumps(loaded_json_data, indent=4) + "\n")

            messagebox.showinfo("File Loaded", f"Loaded and stored content from: {file_path}")

        except json.JSONDecodeError:
            messagebox.showerror("Error", "Failed to load JSON file. Please ensure it is properly formatted.")


def save_changelog():
    if len(long_term_memory) >= CHANGELOG_SIZE:
        last_memory = long_term_memory[-CHANGELOG_SIZE:]
        changelog_summary = generate_changelog(last_memory)
        archived_memory_file = rotate_memory()
        long_term_memory[:] = [{"role": "system", "content": f"Changelog from {archived_memory_file}: {changelog_summary}"}]
        save_memory(LONG_TERM_MEMORY_FILE, long_term_memory)
        messagebox.showinfo("Changelog Saved", "The changelog has been archived and saved.")

def send_message():
    prompt = user_input.get("1.0", "end-1c")
    if prompt.strip():
        reply = chat_with_gpt(prompt, short_term_memory)
        dialog_box.insert(tk.END, f"User: {prompt}\n")
        dialog_box.insert(tk.END, f"Assistant: {reply}\n")
        user_input.delete("1.0", tk.END)

def update_short_term_display():
    short_term_box.delete(1.0, tk.END)
    for entry in short_term_memory:
        short_term_box.insert(tk.END, f"Highlight: {entry['content']}\n")

# Setup main window
window = tk.Tk()
window.title("GPT Memory Manager")
window.geometry("1000x600")

# Left Column: File Uploads and Actions
left_frame = tk.Frame(window, width=200)
left_frame.grid(row=0, column=0, padx=10, pady=10)

file_button = tk.Button(left_frame, text="Upload Memory File", command=load_file)
file_button.pack(pady=5)

archive_button = tk.Button(left_frame, text="Save Changelog", command=save_changelog)
archive_button.pack(pady=5)

# Middle Column: Dialog Box
middle_frame = tk.Frame(window, width=600)
middle_frame.grid(row=0, column=1, padx=10, pady=10)

dialog_box = scrolledtext.ScrolledText(middle_frame, height=25, width=80)
dialog_box.pack()

import time

# Function to simulate auto-scrolling at a readable pace
def readable_scroll(text_widget, response_text, delay=100):
    """
    Insert text progressively into the text widget to simulate a scrolling/typing effect.
    
    :param text_widget: The text widget (dialog_box) where the text is displayed.
    :param response_text: The full GPT response text.
    :param delay: Time in milliseconds between each character insertion.
    """
    text_widget.config(state=tk.NORMAL)  # Enable the widget for editing
    for i in range(len(response_text)):
        text_widget.insert(tk.END, response_text[i])  # Insert one character at a time
        text_widget.see(tk.END)  # Auto-scroll to the end
        text_widget.update_idletasks()  # Update the GUI
        time.sleep(delay / 1000)  # Delay between each character
    text_widget.config(state=tk.DISABLED)  # Disable the widget after typing is done

# Modified function to handle GPT responses
def send_message():
    prompt = user_input.get("1.0", "end-1c").strip()
    if prompt:
        # Clear input and store user message
        dialog_box.insert(tk.END, f"User: {prompt}\n")
        user_input.delete("1.0", tk.END)
        
        # Get GPT's response
        reply = chat_with_gpt(prompt, short_term_memory)

        # Auto-scroll and display GPT's response at a readable pace
        readable_scroll(dialog_box, f"Assistant: {reply}\n", delay=50)  # Set delay to 50ms per character


user_input = tk.Text(middle_frame, height=3, width=60)
user_input.pack(pady=5)

button_frame = tk.Frame(middle_frame)
button_frame.pack()

long_btn = tk.Button(button_frame, text="Long", command=store_in_long_memory)
long_btn.grid(row=0, column=0)

short_btn = tk.Button(button_frame, text="Short", command=store_in_short_memory)
short_btn.grid(row=0, column=1)

send_btn = tk.Button(button_frame, text="Send", command=send_message)
send_btn.grid(row=0, column=2)

# Bind Enter key to send message
window.bind('<Return>', lambda event: send_message())

# Right Column: Short-Term Memory Display
right_frame = tk.Frame(window, width=200)
right_frame.grid(row=0, column=2, padx=10, pady=10)

short_term_box = scrolledtext.ScrolledText(right_frame, height=30, width=30)
short_term_box.pack()

# Toggle Button for Light/Dark Mode
toggle_btn = tk.Button(window, text="Toggle Light/Dark Mode", command=toggle_mode)
toggle_btn.grid(row=1, column=1, pady=10)

# Load memory into the short-term box initially
short_term_memory = load_memory(SHORT_TERM_MEMORY_FILE)
long_term_memory = load_memory(LONG_TERM_MEMORY_FILE)
update_short_term_display()

# Apply initial mode (light mode by default)
apply_mode()

# Start the GUI main loop
window.mainloop()
