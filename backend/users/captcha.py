
import random
import string
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from django.core.cache import cache
import uuid

def generate_captcha():
    # Generate simple arithmetic problem
    num1 = random.randint(1, 9)
    num2 = random.randint(1, 9)
    answer = str(num1 + num2)
    question = f"{num1} + {num2} = ?"

    # Create Image
    img = Image.new('RGB', (120, 40), color = (73, 109, 137))
    d = ImageDraw.Draw(img)
    # Use default font or simple path if available, else just draw text
    # Loading fonts can be tricky in some envs, so we use default
    d.text((10,10), question, fill=(255, 255, 0))
    
    # Add some noise
    for _ in range(20):
        x = random.randint(0, 120)
        y = random.randint(0, 40)
        d.point((x, y), fill=(255, 255, 255))

    # Save to BytesIO
    buf = BytesIO()
    img.save(buf, format='PNG')
    image_bytes = buf.getvalue()

    # Generate Key and Store
    key = str(uuid.uuid4())
    cache.set(f"captcha_{key}", answer, timeout=300) # 5 minutes

    return key, image_bytes
