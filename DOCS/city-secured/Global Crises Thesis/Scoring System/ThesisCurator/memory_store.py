from memory_manager import save_memory
from tkinter import messagebox



def store_in_memory(dialog_box, memory_list, memory_file=None, is_long_term=False):
    dialog_box.focus()
    try:
        highlighted_text = dialog_box.get('sel.first', 'sel.last')
        if highlighted_text:
            memory_list.append({"role": "highlight", "content": highlighted_text})
            if is_long_term and memory_file:
                save_memory(memory_file, memory_list)
                messagebox.showinfo("Memory Stored", "Highlighted text saved to long-term memory.")
    except Exception:
        messagebox.showwarning("No Selection", "Please select a portion of text to store in memory.")
