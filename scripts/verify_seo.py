import requests
import re

url = "https://testdone.in"
try:
    response = requests.get(url, timeout=10)
    content = response.text
    
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    h1_match = re.search(r'<h1.*?>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
    meta_desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
    
    print("--- SEO VERIFICATION ---")
    print(f"Title: {title_match.group(1).strip() if title_match else 'NOT FOUND'}")
    
    # Clean up H1 (remove nested tags if any, though our H1 has them)
    h1_raw = h1_match.group(1).strip() if h1_match else 'NOT FOUND'
    # Simple regex to strip tags for cleaner output
    h1_text = re.sub('<[^<]+?>', '', h1_raw).strip()
    print(f"H1 (Raw): {h1_raw}")
    print(f"H1 (Text): {h1_text}")
    
    print(f"Meta Description: {meta_desc_match.group(1).strip() if meta_desc_match else 'NOT FOUND'}")
    
    # Check for new content
    if "Why Choose TestDone" in content:
        print("Content Check: 'Why Choose TestDone' section FOUND.")
    else:
        print("Content Check: 'Why Choose TestDone' section NOT FOUND.")

except Exception as e:
    print(f"Error: {e}")
