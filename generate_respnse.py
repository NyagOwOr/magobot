import sys
from transformers import pipeline

def main():
    # Extract the prompt passed from Node.js
    prompt = sys.argv[1]

    # Load Hugging Face model
    pipe = pipeline("text-generation", model="meta-llama/Llama-3.2-1B")  # Update model name if needed

    # Generate text
    result = pipe(prompt, max_length=100, num_return_sequences=1)
    print(result[0]["generated_text"])

if __name__ == "__main__":
    main()
