from PIL import Image
import os

# Поточна папка, де знаходиться скрипт
folder_path = os.getcwd()

# Цільовий розмір
target_size = (300, 400)

# Проходимо по файлах в поточній папці
for filename in os.listdir(folder_path):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
        image_path = os.path.join(folder_path, filename)
        
        with Image.open(image_path) as img:
            resized_img = img.resize(target_size)
            resized_img.save(image_path)
        
        print(f"Оброблено: {filename}")

print("Готово!")
