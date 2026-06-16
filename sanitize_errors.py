import os
import re

directory = r'c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v8\jersey-vault\server\src\controllers'
upload_dir = r'c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v8\jersey-vault\server\src\routes'

def process_file(filepath, filename):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content

    def replacer(match):
        return f"console.error('{filename} Error:', error);\n    res.status(500).json({{ message: 'An internal server error occurred.' }});"
    
    new_content = re.sub(r'res\.status\(500\)\.json\(\{ message: error\.message \}\);', replacer, new_content)
    
    new_content = re.sub(r"res\.status\(500\)\.json\(\{ message: error\.message \|\| '[^']+' \}\);", 
                         f"console.error('{filename} Error:', error);\n    res.status(500).json({{ message: 'An internal server error occurred.' }});", new_content)

    new_content = re.sub(r'res\.status\(500\)\.json\(\{ success: false, error: error\.message \}\);', 
                         f"console.error('{filename} Error:', error);\n    res.status(500).json({{ success: false, message: 'An internal server error occurred.' }});", new_content)
    
    new_content = re.sub(r'res\.status\(500\)\.json\(\{ success: false, message: error\.message \}\);', 
                         f"console.error('{filename} Error:', error);\n    res.status(500).json({{ success: false, message: 'An internal server error occurred.' }});", new_content)

    # For adminController.js returning error object inside a JSON
    new_content = re.sub(r"error: error\.message \|\| '[^']+'", "error: 'An internal server error occurred.'", new_content)
    new_content = re.sub(r"error: error\.message\s*(?!\})", "error: 'An internal server error occurred.'\n", new_content)

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filename}')

for filename in os.listdir(directory):
    if filename.endswith('.js'):
        process_file(os.path.join(directory, filename), filename)

for filename in os.listdir(upload_dir):
    if filename.endswith('.js'):
        process_file(os.path.join(upload_dir, filename), filename)
