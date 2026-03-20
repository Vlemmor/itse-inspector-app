import os
import google.generativeai as genai
from dotenv import load_dotenv
import base64
from PIL import Image
import io

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def analyze_image_with_role(image_base64: str, role: str):
    """
    Analyzes an image using Gemini 1.5 Flash to generate a technical description 
    based on the inspector's role.
    """
    try:
        # Prepare the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Decode base64 image
        if "base64," in image_base64:
            image_base64 = image_base64.split("base64,")[1]
            
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Define prompt based on role
        role_label = "Arquitecto / Especialista en Seguridad" if role == "architect" else "Ingeniero Eléctrico"
        
        prompt = f"""
        Actúa como un inspector técnico senior {role_label}.
        Analiza esta fotografía de una inspección ITSE (Inspección Técnica de Seguridad en Edificaciones).
        Detecta un hallazgo o deficiencia relevante según tu especialidad.
        
        Escribe una descripción técnica MUY CONCISA (máximo 2 líneas) para el campo de observaciones.
        Enfócate en lo que se ve en la imagen: grietas, cables expuestos, falta de señalización, extintores vencidos, etc.
        Si no hay nada evidente, sugiere una observación genérica de inspección para esta área.
        
        RESPUESTA DIRECTA SIN PREÁMBULOS:
        """
        
        response = model.generate_content([prompt, image])
        return response.text.strip()
    except Exception as e:
        print(f"Error in analyze_image_with_role: {e}")
        return "No se pudo analizar la imagen automáticamente. Por favor, ingrese la descripción manualmente."

if __name__ == "__main__":
    # Test with dummy/empty image logic if needed
    print("VLM Service ready.")
