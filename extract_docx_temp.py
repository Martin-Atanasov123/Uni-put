import zipfile, xml.etree.ElementTree as ET, sys, io, glob, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pattern = os.path.join(r'C:\Users\atana\Downloads\word', '*ПЛОВДИВ*')
files = glob.glob(pattern)
if not files:
    print("No file found matching pattern")
    sys.exit(1)

docx_path = files[0]
print(f"Reading: {docx_path}\n")

with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)

paragraphs = []
for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
    texts = []
    for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
        if t.text:
            texts.append(t.text)
    line = ''.join(texts).strip()
    if line:
        paragraphs.append(line)

print('\n'.join(paragraphs))
