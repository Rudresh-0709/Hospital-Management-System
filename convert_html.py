import re

with open("stitch_dashboard.html", "r", encoding="utf-8") as f:
    html = f.read()

# basic string replaces
html = html.replace("class=", "className=")
html = html.replace("viewbox=", "viewBox=")
html = html.replace("stroke-linecap=", "strokeLinecap=")
html = html.replace("stroke-dasharray=", "strokeDasharray=")
html = html.replace("stroke-dashoffset=", "strokeDashoffset=")
html = html.replace("stroke-width=", "strokeWidth=")
html = html.replace("preserveaspectratio=", "preserveAspectRatio=")
html = html.replace("fill-rule=", "fillRule=")
html = html.replace("clip-rule=", "clipRule=")
html = html.replace('disabled=""', "disabled={true}")

# remove comments
html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)

# self close tags
html = re.sub(r'<img([^>]+?)(?<!/)>', r'<img\1 />', html)
html = re.sub(r'<input([^>]+?)(?<!/)>', r'<input\1 />', html)

# extract the body content
body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
if body_match:
    content = body_match.group(1).strip()
else:
    content = html

# extract the script tag content for tailwind config
script_match = re.search(r'<script id="tailwind-config">(.*?)</script>', html, re.DOTALL)
tailwind_config = script_match.group(1).strip() if script_match else ""

# extract the custom css
style_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
custom_style = style_match.group(1).strip() if style_match else ""

with open("stitch_dashboard.jsx", "w", encoding="utf-8") as f:
    f.write(f"/* \nTailwind Config:\n{tailwind_config}\n*/\n\n/* \nCustom CSS:\n{custom_style}\n*/\n\n")
    f.write(content)
