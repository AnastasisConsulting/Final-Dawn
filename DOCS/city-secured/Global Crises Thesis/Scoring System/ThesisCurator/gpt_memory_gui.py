import tkinter as tk
from tkinter import scrolledtext, messagebox
from memory_manager import chat_with_gpt, load_memory, save_memory, rotate_memory, generate_changelog
from memory_store import store_in_memory
from file_utils import load_json_file

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
short_term_memory = []
long_term_memory = []
loaded_json_data = None


def toggle_mode():
    global current_mode
    if current_mode == light_mode:
        current_mode = dark_mode
    else:
        current_mode = light_mode
    apply_mode(window)


def apply_mode(window):
    window.config(bg=current_mode["bg"])
    dialog_box.config(bg=current_mode["text_bg"], fg=current_mode["text_fg"])
    user_input.config(bg=current_mode["text_bg"], fg=current_mode["text_fg"])


def send_message():
    prompt = user_input.get("1.0", "end-1c").strip()
    if prompt:
        dialog_box.insert(tk.END, f"User: {prompt}\n")
        user_input.delete("1.0", tk.END)

        reply = chat_with_gpt(prompt, short_term_memory, loaded_json_data)
        dialog_box.insert(tk.END, f"Assistant: {reply}\n")


# Initialize the GUI window
window = tk.Tk()
window.title("GPT Memory Manager")
window.geometry("1000x600")

# Add components here
dialog_box = scrolledtext.ScrolledText(window, height=25, width=80)
dialog_box.pack()

user_input = tk.Text(window, height=3, width=60)
user_input.pack(pady=5)

# Buttons
button_frame = tk.Frame(window)
button_frame.pack()

send_btn = tk.Button(button_frame, text="Send", command=send_message)
send_btn.grid(row=0, column=0)

toggle_btn = tk.Button(window, text="Toggle Light/Dark Mode", command=toggle_mode)
toggle_btn.pack()

# Load memory and start the application
short_term_memory = load_memory("session_memory.json")
long_term_memory = load_memory("long_term_memory.json")

apply_mode(window)
window.mainloop()
