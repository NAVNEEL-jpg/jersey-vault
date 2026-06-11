import os
import re

routes = {
    'Home.jsx': 'https://www.thejerseyvault.in/',
    'Teams.jsx': 'https://www.thejerseyvault.in/teams',
    'FAQ.jsx': 'https://www.thejerseyvault.in/faq',
    'Contact.jsx': 'https://www.thejerseyvault.in/contact',
    'Privacy.jsx': 'https://www.thejerseyvault.in/privacy',
    'Terms.jsx': 'https://www.thejerseyvault.in/terms',
    'Tracking.jsx': 'https://www.thejerseyvault.in/tracking'
}

base_dir = r'c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v7\jersey-vault\client\src\pages'

for filename, url in routes.items():
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'return \(\s*(<Helmet>.*?</Helmet>)\s*(<[a-zA-Z0-9]+[^>]*>|<>)'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        helmet_block = match.group(1)
        next_tag = match.group(2)
        new_return = f'return (\n    {next_tag}\n      {helmet_block}'
        content = content[:match.start()] + new_return + content[match.end():]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {filename}')
    else:
        print(f'No match in {filename}')
