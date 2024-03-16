import sys
import json
from PIL import Image
import io
import base64

def compress_image(input_image_data, quality):
    try:
        # Open the image from the provided image data
        with Image.open(io.BytesIO(input_image_data)) as img:
            # Create an in-memory binary stream to hold the compressed image data
            output_buffer = io.BytesIO()
            img.save(output_buffer, format="JPEG", quality=quality, optimize=True)
            # Get the compressed image data as bytes
            compressed_image_data = output_buffer.getvalue()
            # Encode the compressed image data as base64
            encoded_string = base64.b64encode(compressed_image_data).decode('utf-8')
            return encoded_string
    except Exception as e:
        return json.dumps({"error": str(e)})

# Read base64 encoded image data from stdin
input_data = sys.stdin.buffer.read()
request_data = {"image": input_data}
size = int(sys.argv[1]) if len(sys.argv) > 1 else 10
# Call compress_image function with the image data
compressed_image_base64 = compress_image(request_data["image"], request_data.get("quality", size))
if compressed_image_base64:
    # Print the compressed image data as JSON to stdout
    print(json.dumps({"image": compressed_image_base64}))
else:
    print(json.dumps({"error": "Compression failed"}))
