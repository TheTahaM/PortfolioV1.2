# Read the HTML file to see the current content
try:
    with open('index.html', 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    print("HTML file length:", len(html_content))
    print("\n--- First 1500 characters ---")
    print(html_content[:1500])
    print("\n--- Last 1000 characters ---")
    print(html_content[-1000:])
    
except Exception as e:
    print(f"Error reading file: {e}")