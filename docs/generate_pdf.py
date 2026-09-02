import os
import re
import subprocess

# Paths
base_dir = r"c:\Users\sreya\OneDrive\Desktop\Internship\ReviveX"
md_path = os.path.join(base_dir, "docs", "TECHNICAL_DOCUMENTATION.md")
html_path = os.path.join(base_dir, "docs", "ReviveX_Technical_Documentation.html")
pdf_path = os.path.join(base_dir, "docs", "ReviveX_Technical_Documentation_Report.pdf")

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Markdown parser
def parse_markdown_to_html(md):
    lines = md.split("\n")
    html_lines = []
    in_code_block = False
    code_lang = ""
    in_table = False
    table_lines = []

    def flush_table():
        nonlocal table_lines, in_table
        if not table_lines:
            return ""
        out = ["<div class='table-container'><table>"]
        # Header
        headers = [c.strip() for c in table_lines[0].split("|")[1:-1]]
        out.append("<thead><tr>")
        for h in headers:
            out.append(f"<th>{h}</th>")
        out.append("</tr></thead><tbody>")
        
        # Rows
        for row_line in table_lines[2:]:
            cols = [c.strip() for c in row_line.split("|")[1:-1]]
            if any(cols):
                out.append("<tr>")
                for c in cols:
                    # Parse bold/code in table cells
                    cell = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", c)
                    cell = re.sub(r"`(.*?)`", r"<code>\1</code>", cell)
                    out.append(f"<td>{cell}</td>")
                out.append("</tr>")
        out.append("</tbody></table></div>")
        table_lines = []
        in_table = False
        return "\n".join(out)

    for line in lines:
        stripped = line.strip()

        # Code block toggle
        if stripped.startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_lang = stripped[3:].strip()
                html_lines.append(f"<pre><code class='language-{code_lang}'>")
            else:
                in_code_block = False
                html_lines.append("</code></pre>")
            continue

        if in_code_block:
            # Escape HTML in code blocks
            escaped = (line.replace("&", "&amp;")
                           .replace("<", "&lt;")
                           .replace(">", "&gt;"))
            html_lines.append(escaped)
            continue

        # Tables
        if "|" in stripped and not in_code_block:
            in_table = True
            table_lines.append(stripped)
            continue
        elif in_table:
            html_lines.append(flush_table())

        # Headers
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            html_lines.append(f"<h1 class='doc-title'>{title}</h1>")
        elif stripped.startswith("## "):
            title = stripped[3:].strip()
            html_lines.append(f"<h2 class='section-title'>{title}</h2>")
        elif stripped.startswith("### "):
            title = stripped[4:].strip()
            html_lines.append(f"<h3 class='subsection-title'>{title}</h3>")
        elif stripped.startswith("#### "):
            title = stripped[5:].strip()
            html_lines.append(f"<h4 class='subsubsection-title'>{title}</h4>")
        elif stripped.startswith("---"):
            html_lines.append("<hr />")
        elif stripped.startswith("* ") or stripped.startswith("- "):
            item = stripped[2:].strip()
            item = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", item)
            item = re.sub(r"`(.*?)`", r"<code>\1</code>", item)
            item = re.sub(r"\[(.*?)\]\((.*?)\)", r"<a href='\2'>\1</a>", item)
            html_lines.append(f"<li>{item}</li>")
        elif re.match(r"^\d+\.\s", stripped):
            item = re.sub(r"^\d+\.\s*", "", stripped)
            item = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", item)
            item = re.sub(r"`(.*?)`", r"<code>\1</code>", item)
            item = re.sub(r"\[(.*?)\]\((.*?)\)", r"<a href='\2'>\1</a>", item)
            html_lines.append(f"<li class='numbered-item'>{item}</li>")
        elif stripped.startswith(">"):
            quote = stripped[1:].strip()
            quote = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", quote)
            html_lines.append(f"<blockquote>{quote}</blockquote>")
        elif stripped == "":
            html_lines.append("<br/>")
        else:
            text = stripped
            text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", text)
            text = re.sub(r"`(.*?)`", r"<code>\1</code>", text)
            text = re.sub(r"\[(.*?)\]\((.*?)\)", r"<a href='\2'>\1</a>", text)
            html_lines.append(f"<p>{text}</p>")

    if in_table:
        html_lines.append(flush_table())

    return "\n".join(html_lines)

body_html = parse_markdown_to_html(md_content)

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ReviveX - Technical Documentation & Engineering Handover Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  @page {{
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }}
  
  body {{
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.6;
    font-size: 11pt;
    margin: 0;
    padding: 0;
  }}

  h1, h2, h3, h4 {{
    font-family: 'Manrope', sans-serif;
    color: #064e3b;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
    font-weight: 700;
  }}

  h1.doc-title {{
    font-size: 24pt;
    color: #064e3b;
    border-bottom: 3px solid #059669;
    padding-bottom: 8px;
    margin-top: 0;
  }}

  h2.section-title {{
    font-size: 16pt;
    color: #047857;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 6px;
    page-break-after: avoid;
  }}

  h3.subsection-title {{
    font-size: 13pt;
    color: #0f766e;
    page-break-after: avoid;
  }}

  h4.subsubsection-title {{
    font-size: 11pt;
    color: #134e4a;
    page-break-after: avoid;
  }}

  p, li {{
    color: #334155;
    font-size: 10.5pt;
  }}

  strong {{
    color: #0f172a;
    font-weight: 600;
  }}

  hr {{
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 24px 0;
  }}

  .table-container {{
    width: 100%;
    margin: 16px 0;
    page-break-inside: avoid;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }}

  th {{
    background-color: #064e3b;
    color: #ffffff;
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}

  td {{
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }}

  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  code {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    background-color: #f1f5f9;
    color: #0f766e;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }}

  pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.45;
    page-break-inside: avoid;
    border: 1px solid #1e293b;
  }}

  pre code {{
    background-color: transparent;
    color: #e2e8f0;
    padding: 0;
    border: none;
  }}

  blockquote {{
    border-left: 4px solid #059669;
    margin: 14px 0;
    padding: 8px 16px;
    background-color: #f0fdf4;
    color: #065f46;
    border-radius: 0 8px 8px 0;
    font-style: italic;
  }}

  li {{
    margin-bottom: 4px;
  }}

  .header-tag {{
    display: inline-block;
    background-color: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 9pt;
    font-weight: 600;
    margin-bottom: 12px;
  }}
</style>
</head>
<body>
  <div class="header-tag">MAGNIPLEX LOGITECH — ENGINEERING TECHNICAL HANDOVER</div>
  {body_html}
</body>
</html>"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_template)

print(f"Generated printable HTML: {html_path}")

# Compile to PDF using Microsoft Edge Headless engine
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_exe):
    edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={pdf_path}",
    "--no-pdf-header-footer",
    html_path
]

print(f"Compiling PDF using Edge headless engine...")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"SUCCESS: PDF Report generated successfully at: {pdf_path}")
else:
    print(f"Error compiling PDF: {result.stderr}")
