import os

def find_unsplash(root_dir):
    matches = []
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
        if '.system_generated' in dirs:
            dirs.remove('.system_generated')
        if '.git' in dirs:
            dirs.remove('.git')
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        for i, line in enumerate(f, 1):
                            if 'images.unsplash.com' in line:
                                matches.append(f"{path}:{i}")
                except Exception as e:
                    pass
    return matches

if __name__ == '__main__':
    for m in find_unsplash('C:\\Users\\LENOVO\\OneDrive\\Desktop\\app-cadalix\\projet_bac\\mes-courses-faciles-app'):
        print(m)
