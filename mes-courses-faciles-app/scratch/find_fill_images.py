import os
import re

def find_fill_images(root_dir):
    results = []
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
        for file in files:
            if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Find <Image ... /> blocks or lines
                        # Simple check if file has Image and fill
                        if 'Image' in content and 'fill' in content:
                            # Let's inspect specific tags
                            tags = re.findall(r'<Image[^>]*?>', content, re.DOTALL)
                            for tag in tags:
                                if re.search(r'\bfill\b', tag):
                                    has_sizes = bool(re.search(r'\bsizes\s*=', tag))
                                    results.append({
                                        'path': path,
                                        'tag': tag.strip()[:100].replace('\n', ' '),
                                        'has_sizes': has_sizes
                                    })
                except Exception as e:
                    pass
    return results

if __name__ == '__main__':
    for r in find_fill_images('C:\\Users\\LENOVO\\OneDrive\\Desktop\\app-cadalix\\projet_bac\\mes-courses-faciles-app\\src'):
        print(f"[{'HAS SIZES' if r['has_sizes'] else 'MISSING SIZES'}] {r['path']} -> {r['tag']}")
