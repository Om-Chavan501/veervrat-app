import os
import sys

# List of files and directories to ignore
ignore_list = [
    "file_contents.txt",
    "__pycache__",
    "assets",
    "context_files",
    "node_modules",
    ".git",
    ".gitignore",
    ".vscode",
    ".idea",
    "venv",
    ".venv",
    "env",
    ".env",
    "setup.py",
    "tests",
    "test",
    "docs",
    "examples",
    "example",
    "dist",
    "build",
    "coverage",
    "cover",
    "tmp",
    "temp",
    "logs",
    "log",
    "cache",
    ".cache",
    ".langgraph_api",
    ".DS_Store",
]

# List of file extensions to ignore (binary files and other unwanted formats)
ignore_extensions = {
    # Images
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".tiff",
    ".svg",
    ".ico",
    ".webp",
    # Documents
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    # Archives
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".bz2",
    # Executables and binaries
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    # Python packages
    ".whl",
    ".egg",
    # Network captures
    ".pcap",
    ".pcapng",
    # Audio/Video
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".wav",
    ".flac",
    # Database files
    ".db",
    ".sqlite",
    ".sqlite3",
    # Other binary formats
    ".pyc",
    ".pyo",
    ".pkl",
    ".pickle",
    # Font files
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
    # Certificate files
    ".p12",
    ".pfx",
    ".der",
    ".crt",
    ".cer",
}


def should_ignore_file(filepath):
    """Check if a file should be ignored based on name or extension."""
    filename = os.path.basename(filepath)
    _, ext = os.path.splitext(filename)

    # Check if filename is in ignore list
    if filename in ignore_list:
        return True

    # Check if extension is in ignore list
    if ext.lower() in ignore_extensions:
        return True

    return False


def process_file(filepath, output_file):
    """Processes a single file, writing its relative path and content to the output file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        relative_path = os.path.relpath(filepath, os.getcwd())
        output_file.write(f"File: {relative_path}\n")
        output_file.write("  " + "-" * 40 + "\n")

        # Indent each line of content with 2 spaces
        indented_content = "\n".join("  " + line for line in content.splitlines())
        output_file.write(indented_content + "\n")
        output_file.write("  " + "-" * 40 + "\n")
    except UnicodeDecodeError:
        print(f"Skipping binary file: {filepath}")
    except Exception as e:
        print(f"Error processing file {filepath}: {e}")


def process_directory(dirpath, output_file):
    """Processes all files in a directory (recursively), writing their info to the output file."""
    for root, dirs, files in os.walk(dirpath):
        # Filter and sort directories alphabetically
        dirs[:] = sorted([d for d in dirs if d not in ignore_list])

        # Filter and sort files alphabetically
        filtered_files = [
            f for f in files if not should_ignore_file(os.path.join(root, f))
        ]
        filtered_files.sort()

        for file in filtered_files:
            filepath = os.path.join(root, file)
            process_file(filepath, output_file)


def main():
    """Main function to handle command-line arguments and create the output file."""
    if len(sys.argv) < 2:
        print(
            "Usage: python script.py <file1> <file2> ... <directory1> <directory2> ..."
        )
        return

    # Create file_contents.txt in the current directory
    output_filename = "file_contents.txt"

    try:
        with open(output_filename, "w", encoding="utf-8") as output_file:
            # Sort command line arguments to ensure consistent order
            sorted_args = sorted(sys.argv[1:])

            for arg in sorted_args:
                if os.path.isfile(arg):
                    if not should_ignore_file(arg):
                        process_file(arg, output_file)
                    else:
                        print(f"Ignoring file: {arg}")
                elif os.path.isdir(arg):
                    if os.path.basename(arg) not in ignore_list:
                        process_directory(arg, output_file)
                    else:
                        print(f"Ignoring directory: {arg}")
                else:
                    print(f"Warning: {arg} is not a valid file or directory.")

        print(f"Successfully created {output_filename} in the current directory.")

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
############
# import os
# import sys
# import shutil
# import webbrowser
# import pyautogui
# import time
# import pyperclip

# # List of files and directories to ignore
# ignore_list = [
#     "__init__.py",
#     "__pycache__",
#     "assets",
#     "context_files",
#     "node_modules",
#     ".git",
#     ".gitignore",
#     ".vscode",
#     ".idea",
#     "venv",
#     "env",
#     ".env",
#     "requirements.txt",
#     "README.md",
#     "LICENSE",
#     "setup.py",
#     "tests",
#     "test",
#     "docs",
#     "examples",
#     "example",
#     "dist",
#     "build",
#     "coverage",
#     "cover",
#     "tmp",
#     "temp",
#     "logs",
#     "log",
#     "cache",
#     ".cache",
# ]


# def process_file(filepath, output_file):
#     """Processes a single file, writing its relative path and content to the output file."""
#     try:
#         with open(filepath, "r", encoding="utf-8") as f:
#             content = f.read()
#         relative_path = os.path.relpath(filepath, os.getcwd())
#         output_file.write(f"File: {relative_path}\n")
#         output_file.write("-" * 40 + "\n")
#         output_file.write(content + "\n")
#         output_file.write("-" * 40 + "\n")
#     except Exception as e:
#         print(f"Error processing file {filepath}: {e}")


# def process_directory(dirpath, output_file):
#     """Processes all files in a directory (recursively), writing their info to the output file."""
#     for root, dirs, files in os.walk(dirpath):
#         dirs[:] = [d for d in dirs if d not in ignore_list]

#         for file in files:
#             if file not in ignore_list:
#                 filepath = os.path.join(root, file)
#                 process_file(filepath, output_file)


# def split_file(input_filepath, output_dir, lines_per_file=125):
#     """Splits a large text file into smaller files with a specified number of lines."""
#     os.makedirs(output_dir, exist_ok=True)
#     file_count = 1
#     line_count = 0

#     base_path = os.path.abspath(os.path.dirname(input_filepath))
#     empty_file = os.path.join(base_path, "000.txt")
#     with open(empty_file, "w") as f:
#         pass

#     with open(input_filepath, "r", encoding="utf-8") as infile:
#         outfile = None
#         try:
#             for line in infile:
#                 if line_count % lines_per_file == 0:
#                     if outfile:
#                         outfile.close()

#                     output_filename = os.path.join(output_dir, f"{file_count:03d}.txt")
#                     outfile = open(output_filename, "w", encoding="utf-8")
#                     file_count += 1

#                 outfile.write(line)
#                 line_count += 1
#         finally:
#             if outfile:
#                 outfile.close()


# def clear_context_files(output_directory):
#     """Removes all existing files from the context_files directory."""
#     for filename in os.listdir(output_directory):
#         file_path = os.path.join(output_directory, filename)
#         try:
#             if os.path.isfile(file_path) or os.path.islink(file_path):
#                 os.unlink(file_path)
#             elif os.path.isdir(file_path):
#                 shutil.rmtree(file_path)
#         except Exception as e:
#             print(f"Error deleting file {file_path}: {e}")


# def paste_content(file_path):
#     """Pastes content from a file into the current window."""
#     with open(file_path, "r", encoding="utf-8") as file:
#         content = file.read()
#     # print(f"Pasting content from {file_path}:")
#     # print(content[:100])

#     pyperclip.copy(content)
#     # clipboard_content = pyperclip.paste()
#     # print(f"Clipboard content: {clipboard_content[:100]}")

#     # pyautogui.hotkey("command", "v")
#     pyautogui.hotkey("ctrl", "v")


# def main():
#     """Main function to handle command-line arguments, create the output file, split it, and paste content."""
#     if len(sys.argv) < 2:
#         print(
#             "Usage: python script.py <file1> <file2> ... <directory1> <directory2> ..."
#         )
#         return

#     output_directory = "/usr/local/bin/cmd_reference_scripts/context_files"
#     output_filename = os.path.join(output_directory, "file_contents.txt")

#     # Clear existing files in the output directory
#     clear_context_files(output_directory)
#     os.makedirs(output_directory, exist_ok=True)

#     try:
#         with open(output_filename, "w", encoding="utf-8") as output_file:
#             for arg in sys.argv[1:]:
#                 if os.path.isfile(arg):
#                     if os.path.basename(arg) not in ignore_list:
#                         process_file(arg, output_file)
#                     else:
#                         print(f"Ignoring file: {arg}")
#                 elif os.path.isdir(arg):
#                     if os.path.basename(arg) not in ignore_list:
#                         process_directory(arg, output_file)
#                     else:
#                         print(f"Ignoring directory: {arg}")
#                 else:
#                     print(f"Warning: {arg} is not a valid file or directory.")

#         split_file(output_filename, output_directory)

#         # Ensure Brave Browser is focused
#         print("Please focus Brave Browser and wait for 5 seconds...")
#         # time.sleep(5)

#         # Open Perplexity AI tab once
#         # url = "https://gpt-internal.ai.kpit.com/c/new"
#         url = "https://www.perplexity.ai/"
#         webbrowser.open_new_tab(url)
#         time.sleep(3)

#         # Filter and sort files
#         files_to_paste = sorted(
#             [
#                 filename
#                 for filename in os.listdir(output_directory)
#                 if filename.endswith(".txt") and filename[:-4].isdigit()
#             ]
#         )

#         for filename in files_to_paste:
#             file_path = os.path.join(output_directory, filename)
#             paste_content(file_path)
#             time.sleep(1)  # Wait before pasting next file

#     except Exception as e:
#         print(f"An error occurred: {e}")


# if __name__ == "__main__":
#     main()
