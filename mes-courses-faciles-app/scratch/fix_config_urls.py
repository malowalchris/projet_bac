import json

path = 'C:\\Users\\LENOVO\\OneDrive\\Desktop\\app-cadalix\\projet_bac\\mes-courses-faciles-app\\images-assets-config.json'

with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for store_name, store_info in data.get('stores', {}).items():
    if 'images.unsplash.com' in store_info.get('url', ''):
        clean_slug = ''.join(c if c.isalnum() else '_' for c in store_name)[:20]
        store_info['url'] = f"https://picsum.photos/seed/{clean_slug}/800/800"

for prod_name, prod_info in data.get('products', {}).items():
    if 'images.unsplash.com' in prod_info.get('url', ''):
        clean_slug = ''.join(c if c.isalnum() else '_' for c in prod_name)[:20]
        prod_info['url'] = f"https://picsum.photos/seed/{clean_slug}/800/800"

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated images-assets-config.json successfully!")
